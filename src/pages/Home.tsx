import { FileText, ClipboardList, PlayCircle, BarChart3, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useModelStore } from '../store';
import { useKnowledgeStore } from '../store/knowledgeStore';
import { useAppStore } from '../store/appStore';

export default function Home({ onMenuChange }: { onMenuChange: (menu: string) => void }) {
  const models = useModelStore(state => state.models);
  const categories = useKnowledgeStore(state => state.categories);
  const items = useKnowledgeStore(state => state.items);
  const requirements = useAppStore(state => state.requirements);
  const testCases = useAppStore(state => state.testCases);
  const testExecutions = useAppStore(state => state.testExecutions);

  const activeModels = models.filter(m => m.status === 'active').length;
  const totalKnowledgeItems = items.length;
  const totalCategories = categories.length;
  const totalRequirements = requirements.length;
  const totalTestCases = testCases.length;
  const totalTestExecutions = testExecutions.length;

  const stats = [
    { icon: FileText, label: '需求总数', value: String(totalRequirements), color: 'blue' },
    { icon: ClipboardList, label: '用例数量', value: String(totalTestCases), color: 'green' },
    { icon: PlayCircle, label: '测试执行', value: String(totalTestExecutions), color: 'purple' },
    { icon: Users, label: '可用模型', value: String(activeModels), color: 'cyan' },
    { icon: FileText, label: '知识库条目', value: String(totalKnowledgeItems), color: 'orange' },
  ];

  const recentActivities = [
    { id: 1, type: '需求', title: '用户登录功能', status: '已完成', time: '2小时前', menu: 'requirements' },
    { id: 2, type: '用例', title: '测试用例-001', status: '进行中', time: '3小时前', menu: 'test-cases' },
    { id: 3, type: '执行', title: '回归测试执行', status: '已完成', time: '5小时前', menu: 'test-execution' },
    { id: 4, type: '需求', title: '商品搜索功能', status: '待审核', time: '1天前', menu: 'requirements' },
    { id: 5, type: '模型', title: 'GPT-4已启用', status: '已完成', time: '1天前', menu: 'model-library' },
  ];

  const getStatusClass = (status: string) => {
    if (status === '已完成') return 'bg-green-50 text-green-600';
    if (status === '进行中') return 'bg-yellow-50 text-yellow-600';
    return 'bg-slate-100 text-slate-500';
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      cyan: 'bg-cyan-50 text-cyan-600',
      orange: 'bg-orange-50 text-orange-600',
    };
    return colors[color] || 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">欢迎来到AI自动化测试平台</h1>
        <p className="text-slate-500 mt-1">这是您的测试管理中心，高效管理测试全流程</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg ${getColorClass(stat.color)} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">最近活动</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => activity.menu && onMenuChange(activity.menu)}
              >
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded">
                    {activity.type}
                  </span>
                  <span className="text-slate-700">{activity.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">快速导航</h2>
          </div>
          <div className="p-4 space-y-3">
            <button 
              onClick={() => onMenuChange('requirements')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>新建需求</span>
            </button>
            <button 
              onClick={() => onMenuChange('test-cases')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ClipboardList className="w-5 h-5" />
              <span>创建用例</span>
            </button>
            <button 
              onClick={() => onMenuChange('test-execution')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              <span>执行测试</span>
            </button>
            <button 
              onClick={() => onMenuChange('test-results')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>查看报告</span>
            </button>
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">系统概览</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Users className="w-4 h-4" />
                  已配置模型
                </span>
                <span className="text-slate-800 font-medium">{models.length}个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <FileText className="w-4 h-4" />
                  知识库分类
                </span>
                <span className="text-slate-800 font-medium">{totalCategories}个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <CheckCircle className="w-4 h-4" />
                  可用模型
                </span>
                <span className="text-green-600 font-medium">{activeModels}个</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
