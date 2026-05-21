import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  vectorModel: string;
  itemCount: number;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeStore {
  categories: KnowledgeCategory[];
  items: KnowledgeItem[];
  setCategories: (categories: KnowledgeCategory[]) => void;
  setItems: (items: KnowledgeItem[]) => void;
  addCategory: (category: Omit<KnowledgeCategory, 'id' | 'itemCount' | 'createdAt'>) => void;
  addItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (itemId: string, updates: Partial<KnowledgeItem>) => void;
  deleteItem: (itemId: string) => void;
  getItemsByCategory: (categoryId: string) => KnowledgeItem[];
}

const initialCategories: KnowledgeCategory[] = [
  {
    id: 'business',
    name: '业务功能知识库',
    description: '包含所有业务功能的说明和规范文档',
    icon: 'business',
    vectorModel: 'text-embedding-3-small',
    itemCount: 3,
    createdAt: '2024-01-15',
  },
  {
    id: 'test-cases',
    name: '测试用例知识库',
    description: '测试用例模板、测试场景和测试最佳实践',
    icon: 'test',
    vectorModel: 'text-embedding-3-large',
    itemCount: 2,
    createdAt: '2024-01-16',
  },
  {
    id: 'tech-specs',
    name: '技术规范库',
    description: '技术架构文档和编码规范',
    icon: 'tech',
    vectorModel: 'text-embedding-3-small',
    itemCount: 1,
    createdAt: '2024-01-17',
  },
  {
    id: 'faq',
    name: '常见问题库',
    description: '常见问题解答和故障排除指南',
    icon: 'faq',
    vectorModel: 'text-embedding-ada-002',
    itemCount: 4,
    createdAt: '2024-01-18',
  },
];

const initialItems: KnowledgeItem[] = [
  { id: 'item-1', categoryId: 'business', title: '用户登录功能', content: '用户登录功能是系统的核心入口，支持用户名密码和手机号验证码两种登录方式。', tags: ['登录', '认证', 'JWT'], createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: 'item-2', categoryId: 'business', title: '商品搜索功能', content: '商品搜索功能支持关键词搜索、分类筛选、价格区间、销量排序等功能。', tags: ['搜索', '商品', 'Elasticsearch'], createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: 'item-3', categoryId: 'business', title: '订单创建流程', content: '订单创建流程包含：商品校验、库存扣减、价格计算、优惠券应用等步骤。', tags: ['订单', '流程', '事务'], createdAt: '2024-01-17', updatedAt: '2024-01-17' },
  { id: 'item-4', categoryId: 'test-cases', title: '登录功能测试用例', content: '1. 输入正确的用户名和密码，验证登录成功\n2. 输入错误的密码，验证错误提示\n3. 输入不存在的用户名，验证提示', tags: ['用例', '登录', '验证'], createdAt: '2024-01-18', updatedAt: '2024-01-18' },
  { id: 'item-5', categoryId: 'test-cases', title: '搜索功能边界测试', content: '1. 搜索空字符串的处理\n2. 搜索特殊字符\n3. 超长关键词搜索', tags: ['边界', '搜索', '性能'], createdAt: '2024-01-19', updatedAt: '2024-01-19' },
  { id: 'item-6', categoryId: 'tech-specs', title: '前端编码规范', content: '1. 使用TypeScript编写组件\n2. 统一使用React Hooks\n3. 组件命名采用PascalCase', tags: ['规范', '前端', 'TypeScript'], createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: 'item-7', categoryId: 'faq', title: '如何重置密码', content: '用户可以通过「忘记密码」功能，使用注册邮箱获取密码重置链接。', tags: ['密码', '安全', '邮箱'], createdAt: '2024-01-21', updatedAt: '2024-01-21' },
  { id: 'item-8', categoryId: 'faq', title: '订单支付失败怎么办', content: '支付失败可能原因：网络问题、余额不足、风控拦截、超时等。', tags: ['支付', '失败', '订单'], createdAt: '2024-01-22', updatedAt: '2024-01-22' },
  { id: 'item-9', categoryId: 'faq', title: '优惠券使用规则', content: '优惠券使用规则：每张订单只能使用一张优惠券，有有效期限制。', tags: ['优惠券', '规则', '订单'], createdAt: '2024-01-23', updatedAt: '2024-01-23' },
  { id: 'item-10', categoryId: 'faq', title: '如何联系客服', content: '客服联系方式：在线客服、客服电话、客服邮箱。', tags: ['客服', '联系', '帮助'], createdAt: '2024-01-24', updatedAt: '2024-01-24' },
];

export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      items: initialItems,
      
      setCategories: (categories) => set({ categories }),
      
      setItems: (items) => set({ items }),
      
      addCategory: (category) => {
        const newCategory: KnowledgeCategory = {
          ...category,
          id: Date.now().toString(),
          itemCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set(state => ({ categories: [...state.categories, newCategory] }));
      },
      
      addItem: (item) => {
        const newItem: KnowledgeItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        set(state => {
          const newItems = [...state.items, newItem];
          const newCategories = state.categories.map(cat => 
            cat.id === item.categoryId 
              ? { ...cat, itemCount: cat.itemCount + 1 }
              : cat
          );
          return { items: newItems, categories: newCategories };
        });
      },
      
      updateItem: (itemId, updates) => {
        set(state => ({
          items: state.items.map(item => 
            item.id === itemId 
              ? { ...item, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
              : item
          ),
        }));
      },
      
      deleteItem: (itemId) => {
        set(state => {
          const itemToDelete = state.items.find(item => item.id === itemId);
          const newItems = state.items.filter(item => item.id !== itemId);
          const newCategories = itemToDelete 
            ? state.categories.map(cat => 
                cat.id === itemToDelete.categoryId 
                  ? { ...cat, itemCount: Math.max(0, cat.itemCount - 1) }
                  : cat
              )
            : state.categories;
          return { items: newItems, categories: newCategories };
        });
      },
      
      getItemsByCategory: (categoryId) => {
        return get().items.filter(item => item.categoryId === categoryId);
      },
    }),
    {
      name: 'ai-test-platform-knowledge',
    }
  )
);
