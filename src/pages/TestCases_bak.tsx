import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, X } from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  requirement: string;
  module: string;
  priority: '高' | '中' | '低';
  status: '草稿' | '激活' | '归档';
  steps: string[];
  expectedResult: string;
  createdAt: string;
}

const mockTestCases: TestCase[] = [
  { id: '1', name: '登录功能测试用例', requirement: '用户登录功能', module: '用户模块', priority: '高', status: '激活', steps: ['步骤1', '步骤2', '步骤3'], expectedResult: '登录成功', createdAt: '2024-01-15' },
  { id: '2', name: '搜索功能测试用例', requirement: '商品搜索功能', module: '商品模块', priority: '中', status: '激活', steps: ['步骤1', '步骤2'], expectedResult: '搜索结果显示', createdAt: '2024-01-16' },
  { id: '3', name: '订单创建测试用例', requirement: '订单管理功能', module: '订单模块', priority: '高', status: '草稿', steps: ['步骤1'], expectedResult: '订单创建成功', createdAt: '2024-01-17' },
  { id: '4', name: '购物车添加测试用例', requirement: '购物车功能', module: '商品模块', priority: '中', status: '激活', steps: ['步骤1', '步骤2', '步骤3', '步骤4'], expectedResult: '商品添加成功', createdAt: '2024-01-18' },
];

const modules = ['用户模块', '商品模块', '订单模块', '支付模块'];
const priorities: ('高' | '中' | '低')[] = ['高', '中', '低'];

export default function TestCases() {
  const [showModal, setShowModal] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    requirement: '',
    module: '用户模块',
    priority: '高' as '高' | '中' | '低',
    steps: [''],
    expectedResult: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = mockTestCases.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.requirement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addStep = () => {
    setNewTestCase({ ...newTestCase, steps: [...newTestCase.steps, ''] });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...newTestCase.steps];
    newSteps[index] = value;
    setNewTestCase({ ...newTestCase, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (newTestCase.steps.length > 1) {
      const newSteps = newTestCase.steps.filter((_, i) => i !== index);
      setNewTestCase({ ...newTestCase, steps: newSteps });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setNewTestCase({ name: '', requirement: '', module: '用户模块', priority: '高', steps: [''], expectedResult: '' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用例管理</h1>
          <p className="text-slate-500 mt-1">管理和维护测试用例</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建用例
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">用例名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">关联需求</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">所属模块</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">优先级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">步骤数</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-800 font-medium">{tc.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600">{tc.requirement}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600">{tc.module}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tc.priority === '高' ? 'bg-red-50 text-red-600' :
                      tc.priority === '中' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {tc.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tc.status === '激活' ? 'bg-green-50 text-green-600' :
                      tc.status === '草稿' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {tc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-500 text-sm">{tc.steps.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">用例管理 / 新建用例</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    用例名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestCase.name}
                    onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入用例名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    关联需求
                  </label>
                  <input
                    type="text"
                    value={newTestCase.requirement}
                    onChange={(e) => setNewTestCase({ ...newTestCase, requirement: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入关联需求"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    所属模块 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newTestCase.module}
                    onChange={(e) => setNewTestCase({ ...newTestCase, module: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {modules.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    优先级 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newTestCase.priority}
                    onChange={(e) => setNewTestCase({ ...newTestCase, priority: e.target.value as '高' | '中' | '低' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorities.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  测试步骤 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {newTestCase.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="px-2 py-2 bg-slate-100 text-slate-500 rounded-l-lg flex items-center justify-center w-10 text-sm">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`步骤 ${index + 1}`}
                      />
                      {newTestCase.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addStep}
                  className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加步骤
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  预期结果 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={newTestCase.expectedResult}
                  onChange={(e) => setNewTestCase({ ...newTestCase, expectedResult: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请输入预期结果..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}