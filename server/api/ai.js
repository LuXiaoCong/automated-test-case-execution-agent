import express from 'express';
import axios from 'axios';
import multer from 'multer';
import mammoth from 'mammoth';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function resolveApiKey(bodyKey) {
  const key = (bodyKey && bodyKey.trim()) || (process.env.DEEPSEEK_API_KEY || '').trim();
  return key.replace(/^["']|["']$/g, '');
}

function resolveLlmConfig(body) {
  return {
    apiKey: resolveApiKey(body.apiKey),
    baseUrl: body.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    modelName: body.modelName || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

function normalizeBaseUrl(baseUrl) {
  let url = (baseUrl || 'https://api.deepseek.com').replace(/\/$/, '');
  if (!url.endsWith('/v1')) {
    url += '/v1';
  }
  return url;
}

function determineModelType(baseUrl) {
  const url = baseUrl.toLowerCase();
  if (url.includes('deepseek')) return 'openai';
  if (url.includes('openai')) return 'openai';
  if (url.includes('anthropic')) return 'anthropic';
  if (url.includes('dashscope')) return 'qwen';
  return 'openai';
}

function extractJson(text) {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function chatCompletion(baseUrl, apiKey, modelName, messages, options = {}) {
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  const response = await axios.post(
    url,
    {
      model: modelName,
      messages,
      response_format: options.json ? { type: 'json_object' } : undefined,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 8192,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );
  return response.data.choices[0].message.content;
}

async function callCompatibleLLM(baseUrl, apiKey, modelName, systemPrompt, userContent) {
  const content = await chatCompletion(baseUrl, apiKey, modelName, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ], { json: true });
  return extractJson(content);
}

router.post('/parse-documents', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const documents = [];

    for (const file of files) {
      const name = file.originalname;
      let text = '';

      if (file.mimetype === 'text/plain' || name.endsWith('.txt')) {
        text = file.buffer.toString('utf-8');
      } else if (name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else if (name.endsWith('.pdf')) {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(file.buffer);
        text = data.text;
      } else if (name.endsWith('.doc')) {
        text = '请将 .doc 文件另存为 .docx 格式后重新上传。';
      } else {
        text = '不支持的文件格式';
      }

      documents.push({ name, text: text.trim() });
    }

    res.json({ documents });
  } catch (error) {
    console.error('文档解析失败:', error);
    res.status(500).json({ error: '文档解析失败: ' + (error.message || '未知错误') });
  }
});

router.get('/status', (_req, res) => {
  const hasApiKey = Boolean(resolveApiKey(''));
  res.json({
    hasApiKey,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  });
});

router.post('/analyze', async (req, res) => {
  try {
    const { knowledgeBase, description } = req.body;
    const { apiKey, baseUrl, modelName } = resolveLlmConfig(req.body);

    if (!apiKey) {
      return res.status(400).json({
        error: '未检测到 API Key：请在 server/.env 填写 DEEPSEEK_API_KEY（不是 .env.example），或在模型库配置后重启后端',
        fallback: true,
      });
    }

    const docText = description || '';
    if (!docText.trim()) {
      return res.status(400).json({ error: '需求描述或文档内容不能为空' });
    }

    const systemPrompt = `你是一位资深测试架构师和产品分析师。根据用户提供的业务需求文档，输出严格 JSON（不要 markdown）：
{
  "title": "简洁的需求标题",
  "summary": "需求摘要，包含功能点、边界条件、风险点",
  "code": "关键接口或伪代码建议（字符串，可含换行）"
}
参考知识库类型：${knowledgeBase || '通用'}`;

    const result = await callCompatibleLLM(
      baseUrl,
      apiKey,
      modelName,
      systemPrompt,
      `请分析以下业务需求文档：\n\n${docText.slice(0, 50000)}`
    );

    res.json({
      title: result.title || '未命名需求',
      summary: result.summary || '',
      code: result.code || '',
    });
  } catch (error) {
    console.error('AI分析失败:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'AI分析失败',
      fallback: true,
    });
  }
});

router.post('/generate-test-cases', async (req, res) => {
  try {
    const { documentContent, requirementTitle, knowledgeBase, count = 8 } = req.body;
    const { apiKey, baseUrl, modelName } = resolveLlmConfig(req.body);

    if (!apiKey) {
      return res.status(400).json({
        error: '未检测到 API Key：请在 server/.env 填写 DEEPSEEK_API_KEY（不是 .env.example），或在模型库配置后重启后端',
      });
    }

    const content = documentContent || '';
    if (!content.trim()) {
      return res.status(400).json({ error: '文档内容不能为空' });
    }

    const systemPrompt = `你是一位资深软件测试工程师。根据业务需求文档生成高质量测试用例。
输出严格 JSON（不要 markdown），格式：
{
  "testCases": [
    {
      "name": "用例名称",
      "module": "所属模块，如用户模块/订单模块",
      "priority": "高|中|低",
      "precondition": "前置条件（可选）",
      "steps": ["步骤1", "步骤2"],
      "expectedResult": "预期结果"
    }
  ]
}
要求：
- 生成 ${Math.min(Math.max(Number(count) || 8, 3), 20)} 条左右用例
- 覆盖正常流程、异常流程、边界值、权限与安全
- 步骤具体可执行
- 参考知识库：${knowledgeBase || '测试用例库'}`;

    const userContent = requirementTitle
      ? `需求标题：${requirementTitle}\n\n业务文档内容：\n${content.slice(0, 50000)}`
      : `业务文档内容：\n${content.slice(0, 50000)}`;

    const result = await callCompatibleLLM(baseUrl, apiKey, modelName, systemPrompt, userContent);

    const testCases = (result.testCases || []).map((tc, i) => ({
      name: tc.name || `测试用例 ${i + 1}`,
      module: tc.module || '通用模块',
      priority: ['高', '中', '低'].includes(tc.priority) ? tc.priority : '中',
      precondition: tc.precondition || '',
      steps: Array.isArray(tc.steps) && tc.steps.length > 0 ? tc.steps : ['执行测试操作'],
      expectedResult: tc.expectedResult || '符合需求预期',
    }));

    res.json({ testCases, total: testCases.length });
  } catch (error) {
    console.error('生成测试用例失败:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message || '生成测试用例失败',
    });
  }
});

export default router;
