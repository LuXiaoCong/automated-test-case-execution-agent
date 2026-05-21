import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { llmModel, knowledgeBase, description, apiKey, baseUrl, modelName } = req.body;

    if (!apiKey || !baseUrl || !modelName) {
      return res.status(400).json({ 
        error: '模型配置不完整，请先在模型库中配置API密钥',
        fallback: true 
      });
    }

    let result;
    const modelType = determineModelType(baseUrl);

    switch (modelType) {
      case 'openai':
        result = await callOpenAI(baseUrl, apiKey, modelName, description, knowledgeBase);
        break;
      case 'anthropic':
        result = await callClaude(baseUrl, apiKey, modelName, description, knowledgeBase);
        break;
      case 'qwen':
        result = await callQwen(baseUrl, apiKey, modelName, description, knowledgeBase);
        break;
      default:
        result = await callCustomAPI(baseUrl, apiKey, modelName, description, knowledgeBase);
    }

    res.json(result);
  } catch (error) {
    console.error('AI分析失败:', error);
    res.status(500).json({ 
      error: 'AI分析失败，请检查API密钥是否正确',
      fallback: true 
    });
  }
});

function determineModelType(baseUrl: string): string {
  if (baseUrl.includes('openai')) return 'openai';
  if (baseUrl.includes('anthropic')) return 'anthropic';
  if (baseUrl.includes('dashscope')) return 'qwen';
  return 'custom';
}

async function callOpenAI(baseUrl: string, apiKey: string, modelName: string, description: string, knowledgeBase: string) {
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `你是一个资深的产品需求分析师和后端开发工程师。请分析用户的需求描述，输出JSON格式的结果，包含title(需求标题)、summary(需求摘要)、code(代码建议)。参考知识库: ${knowledgeBase}`
        },
        { role: 'user', content: description }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  
  return JSON.parse(response.data.choices[0].message.content);
}

async function callClaude(baseUrl: string, apiKey: string, modelName: string, description: string, knowledgeBase: string) {
  const response = await axios.post(
    `${baseUrl}/messages`,
    {
      model: modelName,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `请分析以下需求描述，输出JSON格式结果: {"title": "需求标题", "summary": "需求摘要", "code": "代码建议"}。参考知识库: ${knowledgeBase}\n\n需求描述: ${description}`
        }
      ]
    },
    { 
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  return JSON.parse(response.data.content[0].text);
}

async function callQwen(baseUrl: string, apiKey: string, modelName: string, description: string, knowledgeBase: string) {
  const response = await axios.post(
    baseUrl,
    {
      model: modelName,
      input: {
        messages: [
          {
            role: 'system',
            content: `请分析用户的需求描述，输出JSON格式的结果，包含title(需求标题)、summary(需求摘要)、code(代码建议)。参考知识库: ${knowledgeBase}`
          },
          { role: 'user', content: description }
        ]
      },
      parameters: {
        result_format: 'json_object'
      }
    },
    { headers: { 'Authorization': `Bearer ${apiKey}` } }
  );
  
  return JSON.parse(response.data.output.choices[0].message.content);
}

async function callCustomAPI(baseUrl: string, apiKey: string, modelName: string, description: string, knowledgeBase: string) {
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `请分析用户的需求描述，输出JSON格式的结果，包含title(需求标题)、summary(需求摘要)、code(代码建议)。参考知识库: ${knowledgeBase}`
        },
        { role: 'user', content: description }
      ],
      response_format: { type: 'json_object' }
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  
  return JSON.parse(response.data.choices[0].message.content);
}

export default router;
