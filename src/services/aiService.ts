import type { Model } from '../types/model';

export interface AnalyzeResult {
  title: string;
  summary: string;
  code: string;
}

export interface GeneratedTestCase {
  name: string;
  module: string;
  priority: '高' | '中' | '低';
  precondition?: string;
  steps: string[];
  expectedResult: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data as T;
}

export function getPreferredModel(models: Model[]): Model | undefined {
  const deepseek = models.find(
    (m) =>
      m.status === 'active' &&
      (m.name.toLowerCase().includes('deepseek') ||
        m.modelName.includes('deepseek') ||
        m.baseUrl?.includes('deepseek'))
  );
  if (deepseek) return deepseek;

  return models.find((m) => m.status === 'active');
}

export function getModelConfig(model: Model) {
  let baseUrl = (model.baseUrl || 'https://api.deepseek.com').replace(/\/$/, '');
  if (!baseUrl.endsWith('/v1')) {
    baseUrl += '/v1';
  }
  return {
    apiKey: model.apiKey || '',
    baseUrl,
    modelName: model.modelName || 'deepseek-chat',
  };
}

export async function parseDocumentsList(
  files: File[]
): Promise<{ name: string; text: string }[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await fetch('/api/ai/parse-documents', {
    method: 'POST',
    body: formData,
  });

  const data = await parseResponse<{ documents: { name: string; text: string }[] }>(res);
  return data.documents;
}

export async function parseDocuments(files: File[]): Promise<string> {
  const documents = await parseDocumentsList(files);
  return documents.map((d) => `--- [${d.name}] ---\n${d.text}`).join('\n\n');
}

export async function analyzeRequirement(
  model: Model,
  description: string,
  knowledgeBase: string
): Promise<AnalyzeResult> {
  const config = getModelConfig(model);
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...config,
      description,
      knowledgeBase,
    }),
  });

  return parseResponse<AnalyzeResult>(res);
}

export async function generateTestCases(
  model: Model,
  documentContent: string,
  options?: { requirementTitle?: string; knowledgeBase?: string; count?: number }
): Promise<GeneratedTestCase[]> {
  const config = getModelConfig(model);
  const res = await fetch('/api/ai/generate-test-cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...config,
      documentContent,
      requirementTitle: options?.requirementTitle,
      knowledgeBase: options?.knowledgeBase,
      count: options?.count ?? 8,
    }),
  });

  const data = await parseResponse<{ testCases: GeneratedTestCase[] }>(res);
  return data.testCases;
}
