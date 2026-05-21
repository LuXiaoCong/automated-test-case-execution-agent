import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Model } from '../types/model';

export type { Model };

interface ModelStore {
  models: Model[];
  setModels: (models: Model[] | ((prev: Model[]) => Model[])) => void;
}

const initialModels: Model[] = [
  {
    id: 'deepseek-1',
    name: 'DeepSeek Chat',
    type: 'custom',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    modelName: 'deepseek-chat',
    description: 'DeepSeek 大模型，用于需求分析与测试用例生成（推荐）',
    status: 'active',
    createdAt: '2024-01-15',
  },
  { id: '1', name: 'GPT-4', type: 'openai', apiKey: '', baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4', description: 'OpenAI GPT-4 模型', status: 'inactive', createdAt: '2024-01-15' },
  { id: '2', name: 'GPT-3.5 Turbo', type: 'openai', apiKey: '', baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5 Turbo 模型', status: 'inactive', createdAt: '2024-01-16' },
  { id: '3', name: 'Claude 3 Sonnet', type: 'anthropic', apiKey: '', baseUrl: 'https://api.anthropic.com/v1', modelName: 'claude-3-sonnet-20240229', description: 'Anthropic Claude 3 Sonnet', status: 'inactive', createdAt: '2024-01-17' },
  { id: '4', name: 'Qwen Max', type: 'qwen', apiKey: '', baseUrl: 'https://dashscope-api.cn-hangzhou.aliyuncs.com/api/text/completion', modelName: 'qwen-max', description: '阿里云通义千问 Max', status: 'inactive', createdAt: '2024-01-18' },
];

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      models: initialModels,
      setModels: (modelsOrUpdater) => {
        if (typeof modelsOrUpdater === 'function') {
          set({ models: modelsOrUpdater(get().models) });
        } else {
          set({ models: modelsOrUpdater });
        }
      },
    }),
    {
      name: 'ai-test-platform-models',
    }
  )
);
