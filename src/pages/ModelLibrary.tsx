import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Key } from 'lucide-react';
import { useModelStore } from '../store';

interface Model {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'qwen' | 'custom';
  apiKey: string;
  baseUrl?: string;
  modelName: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const modelTypes = [
  { id: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-3.5 Turbo 等模型' },
  { id: 'anthropic', label: 'Anthropic', description: 'Claude 3 系列模型' },
  { id: 'qwen', label: '通义千问', description: '阿里云通义千问系列模型' },
  { id: 'custom', label: '自定义', description: '自定义API端点' },
];

const defaultBaseUrls: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  qwen: 'https://dashscope-api.cn-hangzhou.aliyuncs.com/api/text/completion',
};

const defaultModelNames: Record<string, string> = {
  openai: 'gpt-4',
  anthropic: 'claude-3-sonnet-20240229',
  qwen: 'qwen-max',
  custom: '',
};

export default function ModelLibrary() {
  const models = useModelStore(state => state.models);
  const setModels = useModelStore(state => state.setModels);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'openai' as 'openai' | 'anthropic' | 'qwen' | 'custom',
    apiKey: '',
    baseUrl: '',
    modelName: '',
    description: '',
  });

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTypeChange = (type: 'openai' | 'anthropic' | 'qwen' | 'custom') => {
    setNewModel(prev => ({
      ...prev,
      type,
      baseUrl: defaultBaseUrls[type] || '',
      modelName: defaultModelNames[type] || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingModel) {
      setModels(prev => prev.map(m => 
        m.id === editingModel.id ? { ...newModel, id: m.id, status: m.status, createdAt: m.createdAt } as Model
        : m
      ));
    } else {
      const newId = String(Date.now());
      setModels(prev => [...prev, {
        ...newModel,
        id: newId,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      } as Model]);
    }
    
    setShowModal(false);
    setEditingModel(null);
    setNewModel({
      name: '',
      type: 'openai',
      apiKey: '',
      baseUrl: defaultBaseUrls.openai,
      modelName: defaultModelNames.openai,
      description: '',
    });
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setNewModel({
      name: model.name,
      type: model.type,
      apiKey: model.apiKey,
      baseUrl: model.baseUrl || '',
      modelName: model.modelName,
      description: model.description,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个模型吗？')) {
      setModels(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setModels(prev => prev.map(m => 
      m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
      : m
    ));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">模型库管理</h1>
          <p className="text-slate-500 mt-1">管理大语言模型配置，添加API密钥即可使用</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加模型
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索模型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredModels.map((model) => (
            <div key={model.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    model.type === 'openai' ? 'bg-blue-100 text-blue-600' :
                    model.type === 'anthropic' ? 'bg-purple-100 text-purple-600' :
                    model.type === 'qwen' ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{model.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        model.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {model.status === 'active' ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{model.description}</p>
                    <p className="text-xs text-slate-400 mt-1">模型: {model.modelName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(model.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      model.status === 'active' 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {model.status === 'active' ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleEdit(model)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无模型，请添加一个模型</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingModel ? '编辑模型' : '添加模型'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingModel(null); }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如: GPT-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {modelTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        newModel.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modelType"
                        value={type.id}
                        checked={newModel.type === type.id}
                        onChange={(e) => handleTypeChange(e.target.value as 'openai' | 'anthropic' | 'qwen' | 'custom')}
                        className="sr-only"
                      />
                      <span className={`font-medium ${
                        newModel.type === type.id ? 'text-blue-700' : 'text-slate-700'
                      }`}>{type.label}</span>
                      <p className="text-xs mt-1 text-slate-500">{type.description}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API 基础地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newModel.baseUrl}
                  onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newModel.modelName}
                  onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如: gpt-4, claude-3-sonnet-20240229"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  描述
                </label>
                <textarea
                  value={newModel.description}
                  onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="描述这个模型的用途..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingModel(null); }}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingModel ? '保存修改' : '添加模型'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}