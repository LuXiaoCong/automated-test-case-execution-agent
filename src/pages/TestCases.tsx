import { useState, useRef } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  X,
  Sparkles,
  Loader2,
  Upload,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useModelStore } from '../store';
import {
  generateTestCases,
  getPreferredModel,
  parseDocuments,
} from '../services/aiService';
import type { GeneratedTestCase } from '../services/aiService';

type TestCaseDetailView = {
  name: string;
  requirement: string;
  module: string;
  priority: '高' | '中' | '低';
  status?: string;
  steps: string[];
  expectedResult: string;
  createdAt?: string;
};

function formatExpectedResult(text: string) {
  if (text.includes('前置：') && text.includes('预期：')) {
    const [pre, ...rest] = text.split('\n预期：');
    return { precondition: pre.replace(/^前置：/, '').trim(), expected: rest.join('\n预期：').trim() };
  }
  return { precondition: '', expected: text };
}

export default function TestCases() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCase, setDetailCase] = useState<TestCaseDetailView | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiWarning, setAiWarning] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewCases, setPreviewCases] = useState<GeneratedTestCase[]>([]);
  const [aiForm, setAiForm] = useState({
    requirementId: '',
    customContent: '',
    caseCount: 8,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const testCases = useAppStore((state) => state.testCases);
  const requirements = useAppStore((state) => state.requirements);
  const addTestCases = useAppStore((state) => state.addTestCases);
  const deleteTestCase = useAppStore((state) => state.deleteTestCase);
  const models = useModelStore((state) => state.models);

  const filteredCases = testCases.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.requirement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetail = (tc: TestCaseDetailView) => {
    setDetailCase(tc);
    setShowDetailModal(true);
  };

  const openDetailFromStore = (tc: (typeof testCases)[number]) => {
    openDetail({
      name: tc.name,
      requirement: tc.requirement,
      module: tc.module,
      priority: tc.priority,
      status: tc.status,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      createdAt: tc.createdAt,
    });
  };

  const openDetailFromPreview = (tc: GeneratedTestCase, requirementTitle: string) => {
    openDetail({
      name: tc.name,
      requirement: requirementTitle,
      module: tc.module,
      priority: tc.priority,
      status: '预览',
      steps: tc.steps,
      expectedResult: tc.precondition
        ? `前置：${tc.precondition}\n预期：${tc.expectedResult}`
        : tc.expectedResult,
    });
  };

  const handleFiles = (files: File[]) => {
    const valid = files.filter(
      (f) =>
        f.name.endsWith('.pdf') ||
        f.name.endsWith('.doc') ||
        f.name.endsWith('.docx') ||
        f.name.endsWith('.txt')
    );
    setUploadedFiles((prev) => [...prev, ...valid]);
  };

  const buildDocumentContent = async (): Promise<string> => {
    const parts: string[] = [];
    if (aiForm.requirementId) {
      const req = requirements.find((r) => r.id === aiForm.requirementId);
      if (req) {
        parts.push(`需求标题：${req.title}`);
        if (req.description) parts.push(req.description);
        if (req.aiSummary) parts.push(`AI摘要：\n${req.aiSummary}`);
      }
    }
    if (aiForm.customContent.trim()) {
      parts.push(aiForm.customContent.trim());
    }
    if (uploadedFiles.length > 0) {
      const parsed = await parseDocuments(uploadedFiles);
      parts.push(parsed);
    }
    return parts.join('\n\n');
  };

  const handleAiGenerate = async () => {
    const model = getPreferredModel(models);
    if (!model) {
      setAiWarning('请先在模型库启用 DeepSeek 并配置 API Key');
      return;
    }

    setIsGenerating(true);
    setAiWarning('');
    setPreviewCases([]);

    try {
      const documentContent = await buildDocumentContent();
      if (!documentContent.trim()) {
        setAiWarning('请选择关联需求、输入文档内容或上传业务文档');
        return;
      }

      const req = requirements.find((r) => r.id === aiForm.requirementId);
      const generated = await generateTestCases(model, documentContent, {
        requirementTitle: req?.title,
        count: aiForm.caseCount,
      });
      setPreviewCases(generated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '生成失败';
      setAiWarning(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = () => {
    if (previewCases.length === 0) return;
    const req = requirements.find((r) => r.id === aiForm.requirementId);
    const requirementTitle = req?.title || '业务文档';
    const today = new Date().toISOString().split('T')[0];

    addTestCases(
      previewCases.map((tc, i) => ({
        id: `${Date.now()}-ai-${i}`,
        name: tc.name,
        requirement: requirementTitle,
        module: tc.module,
        priority: tc.priority,
        status: '草稿' as const,
        steps: tc.steps,
        expectedResult: tc.precondition
          ? `前置：${tc.precondition}\n预期：${tc.expectedResult}`
          : tc.expectedResult,
        createdAt: today,
      }))
    );

    setShowAiModal(false);
    setPreviewCases([]);
    setUploadedFiles([]);
    setAiForm({ requirementId: '', customContent: '', caseCount: 8 });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用例管理</h1>
          <p className="text-slate-500 mt-1">管理和维护测试用例，支持 DeepSeek 根据业务文档自动生成</p>
        </div>
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          AI 生成用例
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索用例..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>全部状态</option>
                <option>草稿</option>
                <option>激活</option>
                <option>归档</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  用例名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  关联需求
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  所属模块
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  步骤数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openDetailFromStore(tc)}
                      className="text-slate-800 font-medium hover:text-blue-600 text-left"
                    >
                      {tc.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600">{tc.requirement}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600">{tc.module}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tc.priority === '高'
                          ? 'bg-red-50 text-red-600'
                          : tc.priority === '中'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {tc.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tc.status === '激活'
                          ? 'bg-green-50 text-green-600'
                          : tc.status === '草稿'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-500 text-sm">{tc.steps.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="查看详情"
                        onClick={() => openDetailFromStore(tc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这个用例吗？')) {
                            deleteTestCase(tc.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                DeepSeek 生成测试用例
              </h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {aiWarning && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                  {aiWarning}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">关联需求（可选）</label>
                  <select
                    value={aiForm.requirementId}
                    onChange={(e) => setAiForm({ ...aiForm, requirementId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不关联 / 仅上传文档</option>
                    {requirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">生成数量</label>
                  <select
                    value={aiForm.caseCount}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, caseCount: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        约 {n} 条
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">补充业务描述（可选）</label>
                <textarea
                  value={aiForm.customContent}
                  onChange={(e) => setAiForm({ ...aiForm, customContent: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="可粘贴 PRD、需求说明等文本..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">上传业务文档</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-slate-50"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">支持 PDF、Word、TXT，由后端解析后交给 DeepSeek</p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-slate-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    DeepSeek 正在生成...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    开始生成
                  </>
                )}
              </button>

              {previewCases.length > 0 && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm font-medium text-green-800 mb-3">
                    预览（共 {previewCases.length} 条）
                  </p>
                  <ul className="space-y-2">
                    {previewCases.map((tc, i) => {
                      const reqTitle =
                        requirements.find((r) => r.id === aiForm.requirementId)?.title ||
                        '业务文档';
                      return (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm text-slate-700 bg-white rounded p-2 border border-green-100"
                        >
                          <div>
                            <span className="font-medium">{tc.name}</span>
                            <span className="text-slate-400 ml-2">
                              [{tc.module}] {tc.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openDetailFromPreview(tc, reqTitle)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium shrink-0 ml-2"
                          >
                            查看详情
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveGenerated}
                disabled={previewCases.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                保存到用例库 ({previewCases.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-800">测试用例详情</h2>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{detailCase.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        detailCase.priority === '高'
                          ? 'bg-red-50 text-red-600'
                          : detailCase.priority === '中'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {detailCase.priority}优先级
                    </span>
                    {detailCase.status && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          detailCase.status === '激活'
                            ? 'bg-green-50 text-green-600'
                            : detailCase.status === '草稿'
                              ? 'bg-yellow-50 text-yellow-600'
                              : detailCase.status === '预览'
                                ? 'bg-purple-50 text-purple-600'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {detailCase.status}
                      </span>
                    )}
                  </div>
                </div>
                {detailCase.createdAt && (
                  <span className="text-sm text-slate-400 shrink-0">
                    创建于 {detailCase.createdAt}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">关联需求</p>
                  <p className="text-sm font-medium text-slate-700">{detailCase.requirement || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">所属模块</p>
                  <p className="text-sm font-medium text-slate-700">{detailCase.module}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">
                  测试步骤（共 {detailCase.steps.length} 步）
                </h4>
                <ol className="space-y-2">
                  {detailCase.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">预期结果</h4>
                {(() => {
                  const { precondition, expected } = formatExpectedResult(
                    detailCase.expectedResult
                  );
                  return (
                    <div className="space-y-3">
                      {precondition && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                          <p className="text-xs text-amber-700 font-medium mb-1">前置条件</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{precondition}</p>
                        </div>
                      )}
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <p className="text-xs text-green-700 font-medium mb-1">
                          {precondition ? '预期结果' : '预期结果'}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{expected}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
