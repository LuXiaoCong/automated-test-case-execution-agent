import { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, FileText, Code, TestTube, Database, X, ChevronRight, FolderOpen, Upload, FileType, Loader2, Scissors, Brain } from 'lucide-react';
import { vectorModelOptions } from '../data/knowledgeData';
import { useKnowledgeStore, KnowledgeCategory, KnowledgeItem } from '../store/knowledgeStore';

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    business: Database,
    test: TestTube,
    tech: Code,
    faq: FileText,
  };
  return icons[iconName] || BookOpen;
};

interface FileChunk {
  id: string;
  title: string;
  content: string;
  selected: boolean;
}

export default function KnowledgeBase() {
  const categories = useKnowledgeStore(state => state.categories);
  const items = useKnowledgeStore(state => state.items);
  const addCategory = useKnowledgeStore(state => state.addCategory);
  const addItem = useKnowledgeStore(state => state.addItem);
  const updateItem = useKnowledgeStore(state => state.updateItem);
  const deleteItem = useKnowledgeStore(state => state.deleteItem);
  
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'business', vectorModel: 'text-embedding-3-small' });
  const [newItem, setNewItem] = useState({ title: '', content: '', tags: '' });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileChunks, setFileChunks] = useState<FileChunk[]>([]);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [chunkSize, setChunkSize] = useState(500);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory.id : true;
    const matchesSearch = searchQuery 
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.description) {
      addCategory({
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon,
        vectorModel: newCategory.vectorModel,
      });
      setNewCategory({ name: '', description: '', icon: 'business', vectorModel: 'text-embedding-3-small' });
      setShowCategoryModal(false);
    }
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.content && selectedCategory) {
      addItem({
        categoryId: selectedCategory.id,
        title: newItem.title,
        content: newItem.content,
        tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
      });
      setNewItem({ title: '', content: '', tags: '' });
      setShowItemModal(false);
    }
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item);
    setNewItem({ title: item.title, content: item.content, tags: item.tags.join(', ') });
    setShowItemModal(true);
  };

  const handleUpdateItem = () => {
    if (editingItem && newItem.title && newItem.content) {
      updateItem(editingItem.id, {
        title: newItem.title,
        content: newItem.content,
        tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
      });
      setEditingItem(null);
      setNewItem({ title: '', content: '', tags: '' });
      setShowItemModal(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('确定要删除这个知识条目吗？')) {
      deleteItem(itemId);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      const text = await readFileContent(file);
      const chunks = splitTextIntoChunks(text, chunkSize);
      setFileChunks(chunks.map((content, index) => ({
        id: `chunk-${index}`,
        title: `${file.name} - 片段 ${index + 1}`,
        content,
        selected: true,
      })));
      setShowChunkModal(true);
    } catch (error) {
      alert('文件读取失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      
      if (file.type === 'application/pdf') {
        resolve(`[PDF文件内容: ${file.name}]\n这是一个PDF文件的内容，实际应用中需要使用PDF解析库来提取文本。`);
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        resolve(`[Word文档内容: ${file.name}]\n这是一个Word文档的内容，实际应用中需要使用文档解析库来提取文本。`);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const splitTextIntoChunks = (text: string, size: number): string[] => {
    const chunks: string[] = [];
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (currentChunk.length + trimmedSentence.length > size && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '。' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  };

  const handleCreateChunks = () => {
    if (!selectedCategory) return;

    const selectedChunks = fileChunks.filter(chunk => chunk.selected);
    const newItems: KnowledgeItem[] = selectedChunks.map(chunk => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      categoryId: selectedCategory.id,
      title: chunk.title,
      content: chunk.content,
      tags: ['文件导入', uploadedFile?.name || ''],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    setItems([...items, ...newItems]);
    selectedCategory.itemCount += newItems.length;
    
    setShowChunkModal(false);
    setFileChunks([]);
    setUploadedFile(null);
    setShowItemModal(false);
    
    alert(`成功创建 ${newItems.length} 个知识条目！`);
  };

  const toggleChunkSelection = (chunkId: string) => {
    setFileChunks(chunks => 
      chunks.map(chunk => 
        chunk.id === chunkId ? { ...chunk, selected: !chunk.selected } : chunk
      )
    );
  };

  const selectAllChunks = (selected: boolean) => {
    setFileChunks(chunks => 
      chunks.map(chunk => ({ ...chunk, selected }))
    );
  };

  const reprocessFile = () => {
    if (uploadedFile) {
      setIsProcessing(true);
      readFileContent(uploadedFile).then(text => {
        const chunks = splitTextIntoChunks(text, chunkSize);
        setFileChunks(chunks.map((content, index) => ({
          id: `chunk-${index}`,
          title: `${uploadedFile.name} - 片段 ${index + 1}`,
          content,
          selected: true,
        })));
        setIsProcessing(false);
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">知识库管理</h1>
        <p className="text-slate-500 mt-1">管理和维护测试相关的知识库内容，支持AI智能分析</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">知识库分类</h2>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  selectedCategory === null 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">全部知识库</div>
                  <div className="text-xs text-slate-400">{items.length} 个条目</div>
                </div>
              </button>
              {categories.map(category => {
                const Icon = getIcon(category.icon);
                const vectorModel = vectorModelOptions.find(m => m.id === category.vectorModel);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mt-1 ${
                      selectedCategory?.id === category.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{category.itemCount} 个条目</span>
                        {vectorModel && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded flex items-center gap-0.5">
                            <Brain className="w-3 h-3" />
                            {vectorModel.dimension}维
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {selectedCategory ? selectedCategory.name : '全部知识条目'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500">
                    {selectedCategory ? selectedCategory.description : '展示所有知识库中的条目'}
                  </p>
                  {selectedCategory && (() => {
                    const vectorModel = vectorModelOptions.find(m => m.id === selectedCategory.vectorModel);
                    return vectorModel ? (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        {vectorModel.name}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索知识条目..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setNewItem({ title: '', content: '', tags: '' });
                    setShowItemModal(true);
                  }}
                  disabled={!selectedCategory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  新建条目
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无知识条目</p>
                  <p className="text-sm mt-1">选择一个知识库分类并添加新条目</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">{item.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                          <span className="text-xs text-slate-400 ml-2">
                            更新于 {item.updatedAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">新建知识库分类</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类名称</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入分类名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="请输入分类描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">图标</label>
                <div className="flex gap-2">
                  {['business', 'test', 'tech', 'faq'].map(icon => {
                    const Icon = getIcon(icon);
                    return (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`p-3 rounded-lg border transition-all ${
                          newCategory.icon === icon 
                            ? 'border-blue-500 bg-blue-50 text-blue-600' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    向量模型
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {vectorModelOptions.map(model => (
                    <label
                      key={model.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        newCategory.vectorModel === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="vectorModel"
                        value={model.id}
                        checked={newCategory.vectorModel === model.id}
                        onChange={(e) => setNewCategory({ ...newCategory, vectorModel: e.target.value })}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-700">{model.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">{model.dimension}维</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">
                {editingItem ? '编辑知识条目' : '新建知识条目'}
              </h3>
              <button 
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                  setNewItem({ title: '', content: '', tags: '' });
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">条目标题</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入条目标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">知识库分类</label>
                <input
                  type="text"
                  value={selectedCategory?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
              
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">文件上传（可选）</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.json,.csv,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>正在处理文件...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">点击上传文件，自动切片为知识条目</p>
                        <p className="text-xs text-slate-400 mt-1">支持 TXT、MD、JSON、CSV、Word、PDF 格式</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
                <textarea
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
                  placeholder="请输入知识内容，或上传文件自动生成"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标签</label>
                <input
                  type="text"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="多个标签用逗号分隔，如：登录, 认证, 安全"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                  setNewItem({ title: '', content: '', tags: '' });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChunkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-blue-600" />
                  文件切片预览
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {uploadedFile?.name} - 共生成 {fileChunks.length} 个片段
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowChunkModal(false);
                  setFileChunks([]);
                  setUploadedFile(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={fileChunks.every(c => c.selected)}
                    onChange={(e) => selectAllChunks(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  全选
                </label>
                <span className="text-sm text-slate-500">
                  已选择 {fileChunks.filter(c => c.selected).length} / {fileChunks.length} 个片段
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">切片大小：</label>
                <select
                  value={chunkSize}
                  onChange={(e) => {
                    setChunkSize(Number(e.target.value));
                    reprocessFile();
                  }}
                  className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={300}>300 字符</option>
                  <option value={500}>500 字符</option>
                  <option value={800}>800 字符</option>
                  <option value={1000}>1000 字符</option>
                  <option value={1500}>1500 字符</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fileChunks.map((chunk, index) => (
                <div 
                  key={chunk.id}
                  className={`border rounded-lg p-4 transition-all ${
                    chunk.selected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={chunk.selected}
                      onChange={() => toggleChunkSelection(chunk.id)}
                      className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileType className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">片段 {index + 1}</span>
                        <span className="text-xs text-slate-400">({chunk.content.length} 字符)</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3">{chunk.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowChunkModal(false);
                  setFileChunks([]);
                  setUploadedFile(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleCreateChunks}
                disabled={fileChunks.filter(c => c.selected).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建 {fileChunks.filter(c => c.selected).length} 个条目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
