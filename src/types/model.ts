export interface Model {
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
