export interface RequirementDocumentItem {
  id: string;
  title: string;
  content: string;
  source: 'file' | 'description';
  sourceName?: string;
  order: number;
}

export interface Requirement {
  id: string;
  title: string;
  priority: '高' | '中' | '低';
  llmModel: string;
  knowledgeBase: string;
  description: string;
  documentItems?: RequirementDocumentItem[];
  uploadedFileNames?: string[];
  aiSummary?: string;
  aiCode?: string;
  status: '待审核' | '已审核' | '进行中' | '已完成';
  createdAt: string;
}
