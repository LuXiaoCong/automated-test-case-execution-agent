import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requirement } from '../types/requirement';

export type { Requirement };

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

interface TestExecution {
  id: string;
  name: string;
  type: '冒烟测试' | '回归测试' | '集成测试';
  executor: string;
  totalCases: number;
  passed: number;
  failed: number;
  status: '待执行' | '执行中' | '已完成' | '已取消';
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

interface AppState {
  requirements: Requirement[];
  testCases: TestCase[];
  testExecutions: TestExecution[];
  
  setRequirements: (requirements: Requirement[]) => void;
  addRequirement: (req: Requirement) => void;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  deleteRequirement: (id: string) => void;
  
  setTestCases: (cases: TestCase[]) => void;
  addTestCase: (tc: TestCase) => void;
  addTestCases: (cases: TestCase[]) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  
  setTestExecutions: (executions: TestExecution[]) => void;
  addTestExecution: (exec: TestExecution) => void;
  updateTestExecution: (id: string, updates: Partial<TestExecution>) => void;
  deleteTestExecution: (id: string) => void;
}

const initialRequirements: Requirement[] = [
  { 
    id: '1', 
    title: '用户登录认证功能', 
    priority: '高', 
    llmModel: 'GPT-4', 
    knowledgeBase: 'test-cases', 
    description: '实现用户登录功能，支持用户名密码登录和手机号验证码登录两种方式。需要包含登录状态管理、密码找回、登录失败次数限制等功能。', 
    documentItems: [
      { id: 'demo-1', title: '需求描述 - 片段 1', content: '实现用户登录功能，支持用户名密码登录和手机号验证码登录两种方式。', source: 'description', sourceName: '手动输入', order: 0 },
      { id: 'demo-2', title: '需求描述 - 片段 2', content: '需要包含登录状态管理、密码找回、登录失败次数限制等功能。', source: 'description', sourceName: '手动输入', order: 1 },
    ],
    aiSummary: '用户需要实现一个完整的登录功能，包含用户名密码验证、错误提示、登录状态管理等核心需求。建议采用JWT令牌认证方案，支持密码找回功能和登录失败次数限制。',
    aiCode: `// 用户登录接口实现\ninterface LoginRequest {\n  username: string;\n  password: string;\n}\n\ninterface LoginResponse {\n  token: string;\n  user: User;\n}\n\nasync function login(data: LoginRequest): Promise<LoginResponse> {\n  const response = await fetch('/api/auth/login', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(data)\n  });\n  return response.json();\n}`,
    status: '已完成', 
    createdAt: '2024-01-15' 
  },
  { 
    id: '2', 
    title: '商品搜索与筛选功能', 
    priority: '中', 
    llmModel: 'GPT-4', 
    knowledgeBase: 'business', 
    description: '实现商品搜索功能，支持关键词搜索、分类筛选、价格区间筛选、销量排序等功能。', 
    aiSummary: '用户需要实现商品搜索功能，支持关键词搜索、分类筛选、排序等功能。建议使用Elasticsearch进行全文搜索优化，提高搜索效率和准确性。',
    aiCode: `// 商品搜索接口\ninterface SearchRequest {\n  keyword: string;\n  category?: string;\n  sortBy?: 'price' | 'sales' | 'date';\n  page: number;\n  size: number;\n}\n\nasync function searchProducts(params: SearchRequest): Promise<Product[]> {\n  const query = new URLSearchParams();\n  Object.entries(params).forEach(([key, value]) => {\n    if (value) query.set(key, String(value));\n  });\n  const response = await fetch(\`/api/products/search?\${query}\`);\n  return response.json();\n}`,
    status: '进行中', 
    createdAt: '2024-01-16' 
  },
  { 
    id: '3', 
    title: '订单管理功能', 
    priority: '高', 
    llmModel: 'Claude-3-Sonnet', 
    knowledgeBase: 'test-cases', 
    description: '订单管理功能描述...', 
    aiSummary: '',
    aiCode: '',
    status: '待审核', 
    createdAt: '2024-01-17' 
  },
  { 
    id: '4', 
    title: '购物车功能', 
    priority: '中', 
    llmModel: 'Qwen-Max', 
    knowledgeBase: 'business', 
    description: '购物车功能描述...', 
    aiSummary: '',
    aiCode: '',
    status: '已审核', 
    createdAt: '2024-01-18' 
  },
];

const initialTestCases: TestCase[] = [
  { id: '1', name: '登录功能测试用例', requirement: '用户登录功能', module: '用户模块', priority: '高', status: '激活', steps: ['步骤1', '步骤2', '步骤3'], expectedResult: '登录成功', createdAt: '2024-01-15' },
  { id: '2', name: '搜索功能测试用例', requirement: '商品搜索功能', module: '商品模块', priority: '中', status: '激活', steps: ['步骤1', '步骤2'], expectedResult: '搜索结果显示', createdAt: '2024-01-16' },
  { id: '3', name: '订单创建测试用例', requirement: '订单管理功能', module: '订单模块', priority: '高', status: '草稿', steps: ['步骤1'], expectedResult: '订单创建成功', createdAt: '2024-01-17' },
  { id: '4', name: '购物车添加测试用例', requirement: '购物车功能', module: '商品模块', priority: '中', status: '激活', steps: ['步骤1', '步骤2', '步骤3', '步骤4'], expectedResult: '商品添加成功', createdAt: '2024-01-18' },
];

const initialTestExecutions: TestExecution[] = [
  { id: '1', name: '登录功能测试', type: '冒烟测试', executor: '张三', totalCases: 8, passed: 7, failed: 1, status: '已完成', startTime: '2024-01-19 09:00', endTime: '2024-01-19 11:30', createdAt: '2024-01-19' },
  { id: '2', name: '商品模块测试', type: '回归测试', executor: '李四', totalCases: 24, passed: 20, failed: 4, status: '执行中', startTime: '2024-01-20 10:00', createdAt: '2024-01-20' },
  { id: '3', name: '订单流程集成测试', type: '集成测试', executor: '王五', totalCases: 15, passed: 0, failed: 0, status: '待执行', createdAt: '2024-01-21' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      requirements: initialRequirements,
      testCases: initialTestCases,
      testExecutions: initialTestExecutions,
      
      setRequirements: (requirements) => set({ requirements }),
      addRequirement: (req) => set((state) => ({ requirements: [...state.requirements, req] })),
      updateRequirement: (id, updates) => set((state) => ({
        requirements: state.requirements.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteRequirement: (id) => set((state) => ({
        requirements: state.requirements.filter(r => r.id !== id)
      })),
      
      setTestCases: (cases) => set({ testCases: cases }),
      addTestCase: (tc) => set((state) => ({ testCases: [...state.testCases, tc] })),
      addTestCases: (cases) =>
        set((state) => ({ testCases: [...state.testCases, ...cases] })),
      updateTestCase: (id, updates) => set((state) => ({
        testCases: state.testCases.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteTestCase: (id) => set((state) => ({
        testCases: state.testCases.filter(c => c.id !== id)
      })),
      
      setTestExecutions: (executions) => set({ testExecutions: executions }),
      addTestExecution: (exec) => set((state) => ({ testExecutions: [...state.testExecutions, exec] })),
      updateTestExecution: (id, updates) => set((state) => ({
        testExecutions: state.testExecutions.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteTestExecution: (id) => set((state) => ({
        testExecutions: state.testExecutions.filter(e => e.id !== id)
      })),
    }),
    {
      name: 'ai-test-platform-data',
    }
  )
);
