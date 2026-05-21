import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  PlayCircle, 
  BarChart3,
  Settings,
  Database,
  Layers,
  BookOpen,
  BarChart2,
  Cpu,
  Wrench,
  Brain
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: 'home', label: '首页', icon: LayoutDashboard },
  { id: 'requirements', label: '需求管理', icon: FileText },
  { id: 'test-cases', label: '用例管理', icon: ClipboardList },
  { id: 'test-execution', label: '测试执行', icon: PlayCircle },
  { id: 'test-results', label: '测试结果', icon: BarChart3 },
];

const bottomItems = [
  { id: 'analytics', label: '分析报表', icon: BarChart2 },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'model-library', label: '模型库', icon: Brain },
  { id: 'skills', label: 'Skill引擎', icon: Cpu },
  { id: 'mcp', label: 'MCP工具集成', icon: Wrench },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export default function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  return (
    <aside className="w-60 bg-slate-50 border-r border-slate-200 h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">AI自动化测试平台</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

      </nav>

      <div className="p-4 border-t border-slate-200 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}