import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Upload, X, Sparkles, Loader2, Database, FileText, ListChecks } from 'lucide-react';
import { useModelStore } from '../store';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { useAppStore } from '../store/appStore';
import {
  analyzeRequirement,
  generateTestCases,
  getPreferredModel,
  parseDocuments,
  parseDocumentsList,
} from '../services/aiService';
import {
  buildDocumentSegments,
  mergeSegmentsToDescription,
} from '../lib/documentSegment';
import type { Model } from '../types/model';
import type { Requirement, RequirementDocumentItem } from '../types/requirement';

const priorities: ('高' | '中' | '低')[] = ['高', '中', '低'];
const statusOptions = ['全部状态', '待审核', '已审核', '进行中', '已完成'];

function resolveActiveModel(models: Model[], llmModelId: string): Model | undefined {
  const selected = models.find((m) => m.modelName === llmModelId && m.status === 'active');
  if (selected) return selected;
  return getPreferredModel(models);
}

function buildRequirementKnowledgeContent(req: {
  description: string;
  aiSummary?: string;
  aiCode?: string;
  priority: string;
  llmModel: string;
}) {
  const parts: string[] = [];
  if (req.description.trim()) {
    parts.push(`【需求描述】\n${req.description.trim()}`);
  }
  if (req.aiSummary?.trim()) {
    parts.push(`【AI 分析摘要】\n${req.aiSummary.trim()}`);
  }
  if (req.aiCode?.trim()) {
    parts.push(`【代码建议】\n${req.aiCode.trim()}`);
  }
  parts.push(`【元信息】\n优先级：${req.priority}\n关联模型：${req.llmModel}\n来源：需求管理自动同步`);
  return parts.join('\n\n');
}

export default function Requirements() {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [activeDetailItemId, setActiveDetailItemId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewSegments, setPreviewSegments] = useState<RequirementDocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [analysisWarning, setAnalysisWarning] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingCases, setIsGeneratingCases] = useState(false);
  
  const handleShowModal = () => {
    const currentLlmModel = llmOptions.length > 0 ? llmOptions[0].id : '';
    const currentKnowledgeBase = categories.length > 0 ? categories[0].id : 'test-cases';
    setNewRequirement({
      title: '',
      priority: '高',
      llmModel: currentLlmModel,
      knowledgeBase: currentKnowledgeBase,
      knowledgeBaseContentId: '',
      description: '',
      aiSummary: '',
      aiCode: '',
    });
    setAnalysisWarning('');
    setUploadedFiles([]);
    setPreviewSegments([]);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setUploadedFiles([]);
    setPreviewSegments([]);
  };

  const openRequirementDetail = (req: Requirement) => {
    setSelectedRequirement(req);
    setActiveDetailItemId(req.documentItems?.[0]?.id ?? null);
    setShowDetailModal(true);
  };
  
  const models = useModelStore(state => state.models);
  const activeModels = models.filter(m => m.status === 'active');
  const llmOptions = activeModels.map(model => ({
    id: model.modelName,
    label: model.name,
  }));

  const categories = useKnowledgeStore(state => state.categories);
  const getItemsByCategory = useKnowledgeStore(state => state.getItemsByCategory);
  const addKnowledgeItem = useKnowledgeStore(state => state.addItem);
  
  const knowledgeBaseOptions = categories.map(cat => ({
    id: cat.id,
    label: cat.name,
    description: cat.description,
  }));

  const requirements = useAppStore(state => state.requirements);
  const addRequirement = useAppStore(state => state.addRequirement);
  const deleteRequirement = useAppStore(state => state.deleteRequirement);
  const addTestCases = useAppStore(state => state.addTestCases);

  const defaultLlmModel = llmOptions.length > 0 ? llmOptions[0].id : '';
  const defaultKnowledgeBase = categories.length > 0 ? categories[0].id : 'test-cases';
  
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    priority: '高' as '高' | '中' | '低',
    llmModel: defaultLlmModel,
    knowledgeBase: defaultKnowledgeBase,
    knowledgeBaseContentId: '',
    description: '',
    aiSummary: '',
    aiCode: '',
  });

  const filteredRequirements = requirements.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '全部状态' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runAIAnalysis = async (documentText: string) => {
    if (!documentText.trim()) {
      setAnalysisWarning('请先输入需求描述或上传业务文档');
      setTimeout(() => setAnalysisWarning(''), 4000);
      return;
    }

    const model = resolveActiveModel(models, newRequirement.llmModel);
    if (!model) {
      setAnalysisWarning('请先在模型库启用 DeepSeek 或其他模型');
      setTimeout(() => setAnalysisWarning(''), 4000);
      return;
    }

    if (!model.apiKey?.trim()) {
      setAnalysisWarning('提示：未配置 API Key，将尝试使用服务端 DEEPSEEK_API_KEY 环境变量');
    }

    setAnalysisWarning('');
    setIsAnalyzing(true);

    try {
      const kbLabel = knowledgeBaseOptions.find((k) => k.id === newRequirement.knowledgeBase)?.label;
      const analysis = await analyzeRequirement(model, documentText, kbLabel || newRequirement.knowledgeBase);
      setNewRequirement((prev) => ({
        ...prev,
        title: analysis.title || prev.title,
        description: documentText,
        aiSummary: analysis.summary,
        aiCode: analysis.code,
      }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : '分析失败';
      setAnalysisWarning(`分析失败：${msg}。请确认后端已启动且 API Key 正确`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIanalysis = () => runAIAnalysis(newRequirement.description);

  const handleKnowledgeBaseChange = (knowledgeBase: string) => {
    setNewRequirement(prev => ({
      ...prev,
      knowledgeBase,
      knowledgeBaseContentId: '',
    }));
  };

  const handleKnowledgeBaseContentSelect = (contentId: string) => {
    const contents = getItemsByCategory(newRequirement.knowledgeBase);
    const selectedContent = contents.find(c => c.id === contentId);
    
    if (selectedContent) {
      setNewRequirement(prev => ({
        ...prev,
        knowledgeBaseContentId: contentId,
        description: prev.description || selectedContent.content,
      }));
    } else {
      setNewRequirement(prev => ({
        ...prev,
        knowledgeBaseContentId: '',
      }));
    }
  };

  const resolveDocumentSegments = async (): Promise<RequirementDocumentItem[]> => {
    const documents =
      uploadedFiles.length > 0 ? await parseDocumentsList(uploadedFiles) : [];
    return buildDocumentSegments(documents, newRequirement.description);
  };

  const handlePreviewSegments = async () => {
    if (!newRequirement.description.trim() && uploadedFiles.length === 0) {
      setAnalysisWarning('请先输入需求描述或上传文档');
      setTimeout(() => setAnalysisWarning(''), 3000);
      return;
    }
    try {
      setIsSaving(true);
      setAnalysisWarning('');
      const segments = await resolveDocumentSegments();
      setPreviewSegments(segments);
      if (segments.length === 0) {
        setAnalysisWarning('未能解析出有效条目');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '解析失败';
      setAnalysisWarning(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequirement.title.trim()) return;
    if (!newRequirement.description.trim() && uploadedFiles.length === 0) {
      setAnalysisWarning('请填写需求描述或上传业务文档');
      return;
    }

    setIsSaving(true);
    setAnalysisWarning('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const kbCategory = categories.find((c) => c.id === newRequirement.knowledgeBase);
      const documentItems = await resolveDocumentSegments();
      const description =
        documentItems.length > 0
          ? mergeSegmentsToDescription(documentItems)
          : newRequirement.description;

      const reqId = Date.now().toString();

      addRequirement({
        id: reqId,
        title: newRequirement.title,
        priority: newRequirement.priority,
        llmModel: newRequirement.llmModel,
        knowledgeBase: newRequirement.knowledgeBase,
        description,
        documentItems,
        uploadedFileNames: uploadedFiles.map((f) => f.name),
        aiSummary: newRequirement.aiSummary,
        aiCode: newRequirement.aiCode,
        status: '待审核',
        createdAt: today,
      });

      documentItems.forEach((item) => {
        addKnowledgeItem({
          categoryId: newRequirement.knowledgeBase,
          title: `${newRequirement.title} / ${item.title}`,
          content: item.content,
          tags: [
            '需求',
            '文档条目',
            item.source === 'file' ? '文件' : '描述',
            newRequirement.priority,
          ],
        });
      });

      if (newRequirement.aiSummary || newRequirement.aiCode) {
        addKnowledgeItem({
          categoryId: newRequirement.knowledgeBase,
          title: `${newRequirement.title} / AI分析汇总`,
          content: buildRequirementKnowledgeContent({
            description,
            aiSummary: newRequirement.aiSummary,
            aiCode: newRequirement.aiCode,
            priority: newRequirement.priority,
            llmModel: newRequirement.llmModel,
          }),
          tags: ['需求', 'AI分析', newRequirement.priority, kbCategory?.name || ''],
        });
      }

      setShowModal(false);
      setUploadedFiles([]);
      setPreviewSegments([]);
      setNewRequirement({
        title: '',
        priority: '高',
        llmModel: defaultLlmModel,
        knowledgeBase: defaultKnowledgeBase,
        knowledgeBaseContentId: '',
        description: '',
        aiSummary: '',
        aiCode: '',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '保存失败';
      setAnalysisWarning(`保存失败：${msg}。请确认后端已启动`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setNewRequirement(prev => ({ ...prev, description: value }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const isValidType = validTypes.includes(file.type) || 
                         file.name.endsWith('.pdf') || 
                         file.name.endsWith('.doc') || 
                         file.name.endsWith('.docx') || 
                         file.name.endsWith('.txt');
      return isValidType && file.size <= 20 * 1024 * 1024;
    });
    
    if (validFiles.length !== files.length) {
      setAnalysisWarning('部分文件格式不支持或超过大小限制，已过滤无效文件');
      setTimeout(() => setAnalysisWarning(''), 3000);
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeWithFiles = async () => {
    let combinedText = newRequirement.description || '';
    if (uploadedFiles.length > 0) {
      try {
        setIsAnalyzing(true);
        const parsed = await parseDocuments(uploadedFiles);
        combinedText = [combinedText, parsed].filter(Boolean).join('\n\n');
      } catch (error) {
        const msg = error instanceof Error ? error.message : '文档解析失败';
        setAnalysisWarning(msg);
        setIsAnalyzing(false);
        return;
      }
      setIsAnalyzing(false);
    }
    await runAIAnalysis(combinedText);
  };

  const handleGenerateTestCasesFromRequirement = async (req: typeof selectedRequirement) => {
    if (!req) return;
    const model = resolveActiveModel(models, req.llmModel);
    if (!model) {
      alert('请先在模型库启用 DeepSeek 并配置 API Key');
      return;
    }

    const docContent = [
      req.documentItems?.length
        ? mergeSegmentsToDescription(req.documentItems)
        : req.description,
      req.aiSummary,
    ]
      .filter(Boolean)
      .join('\n\n');
    if (!docContent.trim()) {
      alert('该需求缺少文档内容，请先进行 AI 分析');
      return;
    }

    setIsGeneratingCases(true);
    try {
      const kbLabel = knowledgeBaseOptions.find((k) => k.id === req.knowledgeBase)?.label;
      const generated = await generateTestCases(model, docContent, {
        requirementTitle: req.title,
        knowledgeBase: kbLabel,
        count: 10,
      });

      const today = new Date().toISOString().split('T')[0];
      addTestCases(
        generated.map((tc, i) => ({
          id: `${Date.now()}-${i}`,
          name: tc.name,
          requirement: req.title,
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

      alert(`已生成 ${generated.length} 条测试用例，请前往「用例管理」查看`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '生成失败';
      alert(`生成测试用例失败：${msg}`);
    } finally {
      setIsGeneratingCases(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">需求管理</h1>
          <p className="text-slate-500 mt-1">管理和跟踪测试需求，支持AI智能分析与知识库查询</p>
        </div>
        <button
          onClick={handleShowModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建需求
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索需求..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">需求标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">优先级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">LLM模型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">知识库</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">文档条目</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openRequirementDetail(req)}
                      className="text-slate-800 font-medium hover:text-blue-600 text-left"
                    >
                      {req.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      req.priority === '高' ? 'bg-red-50 text-red-600' :
                      req.priority === '中' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600">{req.llmModel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full">
                      <Database className="w-3 h-3" />
                      {knowledgeBaseOptions.find(k => k.id === req.knowledgeBase)?.label || req.knowledgeBase}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      req.status === '已完成' ? 'bg-green-50 text-green-600' :
                      req.status === '进行中' ? 'bg-blue-50 text-blue-600' :
                      req.status === '已审核' ? 'bg-purple-50 text-purple-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-500 text-sm">
                      {req.documentItems?.length ?? 0} 条
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-500 text-sm">{req.createdAt}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openRequirementDetail(req)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('确定要删除这条需求吗？')) {
                            deleteRequirement(req.id);
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">需求管理 / 新建需求</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    需求标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRequirement.title}
                    onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI将自动生成标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    大语言模型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newRequirement.llmModel}
                    onChange={(e) => setNewRequirement({ ...newRequirement, llmModel: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {llmOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  知识库 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {knowledgeBaseOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        newRequirement.knowledgeBase === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="knowledgeBase"
                        value={option.id}
                        checked={newRequirement.knowledgeBase === option.id}
                        onChange={(e) => handleKnowledgeBaseChange(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <Database className={`w-5 h-5 ${
                          newRequirement.knowledgeBase === option.id ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                        <span className={`font-medium ${
                          newRequirement.knowledgeBase === option.id ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择已有知识库内容
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleKnowledgeBaseContentSelect('')}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        !newRequirement.knowledgeBaseContentId
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-medium">自定义输入</span>
                      <p className="text-xs mt-1 opacity-70">手动输入需求描述</p>
                    </button>
                    {getItemsByCategory(newRequirement.knowledgeBase).map((content) => (
                      <button
                        key={content.id}
                        type="button"
                        onClick={() => handleKnowledgeBaseContentSelect(content.id)}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          newRequirement.knowledgeBaseContentId === content.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{content.title}</span>
                        <p className="text-xs mt-1 opacity-70 line-clamp-2">{content.content.substring(0, 30)}...</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  优先级 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {priorities.map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={newRequirement.priority === p}
                        onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value as '高' | '中' | '低' })}
                        className={`w-4 h-4 ${
                          p === '高' ? 'text-red-500' :
                          p === '中' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}
                      />
                      <span className={`text-sm ${
                        p === '高' ? 'text-red-600' :
                        p === '中' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                {analysisWarning && (
                  <div className={`mb-3 p-3 rounded-lg text-sm ${
                    analysisWarning.includes('错误') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {analysisWarning}
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    需求描述 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePreviewSegments}
                      disabled={isSaving || isAnalyzing}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      预览条目化
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyzeWithFiles}
                      disabled={isAnalyzing || isSaving}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isAnalyzing
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI分析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          AI智能分析
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={newRequirement.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请输入需求描述，AI将分析您的需求并生成标题和代码建议..."
                />
              </div>

              {newRequirement.aiSummary && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI分析结果
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-blue-600 mb-1">需求摘要</p>
                      <p className="text-sm text-slate-700">{newRequirement.aiSummary}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">代码建议</p>
                      <pre className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 overflow-x-auto">
                        {newRequirement.aiCode}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">上传需求文档</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-3 ${
                    isDragging ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <p className={`mb-1 ${isDragging ? 'text-blue-600' : 'text-slate-500'}`}>
                    {isDragging ? '松开鼠标上传文件' : '点击或拖拽文件到此处上传'}
                  </p>
                  <p className="text-xs text-slate-400">支持 PDF、Word、TXT 格式，单个文件不超过 20MB</p>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-slate-600">已上传文件 ({uploadedFiles.length})</p>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  保存时将解析文档并按段落/句子拆分为多条需求条目
                </p>
              </div>

              {previewSegments.length > 0 && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-emerald-800 mb-2">
                    条目化预览（共 {previewSegments.length} 条）
                  </p>
                  <ul className="space-y-2">
                    {previewSegments.map((item) => (
                      <li
                        key={item.id}
                        className="text-sm bg-white rounded p-2 border border-emerald-100"
                      >
                        <span className="font-medium text-slate-800">{item.title}</span>
                        <span className="text-slate-400 ml-2 text-xs">
                          [{item.source === 'file' ? '文档' : '描述'}]
                        </span>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{item.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                <Database className="w-3.5 h-3.5" />
                保存后将解析文档、条目化存储，并同步到知识库「
                {knowledgeBaseOptions.find((k) => k.id === newRequirement.knowledgeBase)?.label}
                」
              </p>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      解析保存中...
                    </>
                  ) : (
                    '保存并同步知识库'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">需求详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{selectedRequirement.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRequirement.priority === '高' ? 'bg-red-50 text-red-600' :
                      selectedRequirement.priority === '中' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {selectedRequirement.priority}优先级
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRequirement.status === '已完成' ? 'bg-green-50 text-green-600' :
                      selectedRequirement.status === '进行中' ? 'bg-blue-50 text-blue-600' :
                      selectedRequirement.status === '已审核' ? 'bg-purple-50 text-purple-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedRequirement.status}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-slate-400">创建于 {selectedRequirement.createdAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">使用模型</p>
                  <p className="text-sm font-medium text-slate-700">{selectedRequirement.llmModel}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">参考知识库</p>
                  <p className="text-sm font-medium text-slate-700">
                    {knowledgeBaseOptions.find(k => k.id === selectedRequirement.knowledgeBase)?.label || selectedRequirement.knowledgeBase}
                  </p>
                </div>
              </div>

              {selectedRequirement.uploadedFileNames &&
                selectedRequirement.uploadedFileNames.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-2">已上传文档</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequirement.uploadedFileNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600"
                        >
                          <FileText className="w-3 h-3" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selectedRequirement.documentItems &&
              selectedRequirement.documentItems.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    文档条目（共 {selectedRequirement.documentItems.length} 条）
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[200px]">
                    <div className="md:col-span-1 border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                      {selectedRequirement.documentItems
                        .sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveDetailItemId(item.id)}
                            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 text-sm transition-colors ${
                              activeDetailItemId === item.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="font-medium">
                              {index + 1}. {item.title}
                            </span>
                            <span className="block text-xs text-slate-400 mt-0.5">
                              {item.source === 'file' ? `文档 · ${item.sourceName}` : '需求描述'}
                            </span>
                          </button>
                        ))}
                    </div>
                    <div className="md:col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                      {(() => {
                        const active = selectedRequirement.documentItems?.find(
                          (i) => i.id === activeDetailItemId
                        );
                        if (!active) {
                          return (
                            <p className="text-sm text-slate-400">请选择左侧条目查看详情</p>
                          );
                        }
                        return (
                          <>
                            <h5 className="text-sm font-semibold text-slate-800 mb-2">
                              {active.title}
                            </h5>
                            <p className="text-xs text-slate-500 mb-3">
                              来源：{active.sourceName || (active.source === 'file' ? '文档' : '描述')}
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {active.content}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">需求描述</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedRequirement.description || '暂无内容'}
                  </p>
                </div>
              )}

              {selectedRequirement.aiSummary && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI分析结果
                  </h4>
                  
                  <div className="mb-4">
                    <p className="text-xs text-blue-600 mb-1">需求摘要</p>
                    <p className="text-sm text-slate-700">{selectedRequirement.aiSummary}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-blue-600 mb-1">代码建议</p>
                    <pre className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 overflow-x-auto">
                      {selectedRequirement.aiCode}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                disabled={isGeneratingCases}
                onClick={() => handleGenerateTestCasesFromRequirement(selectedRequirement)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isGeneratingCases ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <ListChecks className="w-4 h-4" />
                    DeepSeek 生成测试用例
                  </>
                )}
              </button>
              <button
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
