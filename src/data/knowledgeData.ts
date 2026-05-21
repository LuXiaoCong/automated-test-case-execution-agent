export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  vectorModel: string;
  itemCount: number;
  createdAt: string;
}

export const vectorModelOptions = [
  { id: 'text-embedding-3-small', name: 'OpenAI text-embedding-3-small', dimension: 1536, description: 'OpenAI 小型嵌入模型，适合一般用途' },
  { id: 'text-embedding-3-large', name: 'OpenAI text-embedding-3-large', dimension: 3072, description: 'OpenAI 大型嵌入模型，精度更高' },
  { id: 'text-embedding-ada-002', name: 'OpenAI text-embedding-ada-002', dimension: 1536, description: 'OpenAI Ada 嵌入模型' },
  { id: 'bge-large-zh', name: 'BGE-Large-ZH', dimension: 1024, description: '中文 BGE 大模型，适合中文场景' },
  { id: 'bge-base-zh', name: 'BGE-Base-ZH', dimension: 768, description: '中文 BGE 基础模型' },
  { id: 'm3e-base', name: 'M3E-Base', dimension: 768, description: '中文 M3E 嵌入模型' },
  { id: 'bce-embedding-base', name: 'BCE-Embedding-Base', dimension: 768, description: '中英双语 BCE 嵌入模型' },
];

export interface KnowledgeItem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const mockCategories: KnowledgeCategory[] = [
  { id: 'business', name: '业务功能知识库', description: '业务功能描述、业务规则和业务逻辑文档', icon: 'business', vectorModel: 'text-embedding-3-small', itemCount: 12, createdAt: '2024-01-15' },
  { id: 'test-cases', name: '测试用例知识库', description: '测试用例模板、测试场景和测试最佳实践', icon: 'test', vectorModel: 'bge-large-zh', itemCount: 28, createdAt: '2024-01-16' },
  { id: 'tech', name: '技术文档知识库', description: 'API文档、技术规范、架构设计文档', icon: 'tech', vectorModel: 'text-embedding-3-large', itemCount: 15, createdAt: '2024-01-17' },
  { id: 'faq', name: '常见问题知识库', description: '常见问题解答、故障排查指南', icon: 'faq', vectorModel: 'bce-embedding-base', itemCount: 45, createdAt: '2024-01-18' },
];

export const mockItems: KnowledgeItem[] = [
  { id: 'b1', categoryId: 'business', title: '用户登录功能', content: '用户输入正确的用户名和密码后，系统应验证成功并跳转至首页；用户输入错误的用户名或密码时，系统应提示错误信息；用户连续输错5次后，系统应锁定账号10分钟。', tags: ['登录', '认证', '安全'], createdAt: '2024-01-15', updatedAt: '2024-01-20' },
  { id: 'b2', categoryId: 'business', title: '商品搜索功能', content: '支持关键词搜索、分类筛选、价格区间筛选、排序（按价格、销量、上架时间）；搜索结果分页展示；支持模糊搜索和精确搜索。', tags: ['搜索', '筛选', '排序'], createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: 'b3', categoryId: 'business', title: '购物车功能', content: '添加商品到购物车、修改数量、删除商品、清空购物车；显示商品总价、优惠信息；库存检查；商品失效提醒；批量操作', tags: ['购物车', '订单'], createdAt: '2024-01-17', updatedAt: '2024-01-17' },
  { id: 'b4', categoryId: 'business', title: '订单管理功能', content: '订单创建、订单支付、订单状态追踪、订单取消、订单退款；订单列表查询（全部、待付款、待发货、待收货、已完成）；订单详情查看；订单评价', tags: ['订单', '支付'], createdAt: '2024-01-18', updatedAt: '2024-01-18' },
  { id: 't1', categoryId: 'test-cases', title: '登录测试用例模板', content: '前置条件：用户已注册账号\n1. 输入正确用户名和密码，点击登录\n2. 验证跳转首页\n3. 输入错误密码，验证错误提示\n4. 输入不存在的用户名，验证错误提示\n5. 连续输错5次，验证账号锁定', tags: ['测试用例', '登录', '模板'], createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: 't2', categoryId: 'test-cases', title: '搜索功能测试用例', content: '前置条件：系统已有商品数据\n1. 输入有效关键词，验证搜索结果\n2. 输入无效关键词，验证无结果提示\n3. 输入特殊字符，验证安全性\n4. 验证筛选功能\n5. 验证排序功能', tags: ['测试用例', '搜索'], createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: 't3', categoryId: 'test-cases', title: '购物车测试用例', content: '前置条件：用户已登录\n1. 添加商品到购物车\n2. 修改商品数量\n3. 删除商品\n4. 清空购物车\n5. 验证价格计算', tags: ['测试用例', '购物车'], createdAt: '2024-01-17', updatedAt: '2024-01-17' },
  { id: 't4', categoryId: 'test-cases', title: '订单流程测试用例', content: '前置条件：用户已登录，购物车有商品\n1. 提交订单\n2. 选择支付方式\n3. 完成支付\n4. 验证订单状态变更\n5. 订单取消流程', tags: ['测试用例', '订单'], createdAt: '2024-01-18', updatedAt: '2024-01-18' },
];

export const getItemsByCategory = (categoryId: string): KnowledgeItem[] => {
  return mockItems.filter(item => item.categoryId === categoryId);
};

export const getCategoryById = (id: string): KnowledgeCategory | undefined => {
  return mockCategories.find(cat => cat.id === id);
};

export const getItemById = (id: string): KnowledgeItem | undefined => {
  return mockItems.find(item => item.id === id);
};
