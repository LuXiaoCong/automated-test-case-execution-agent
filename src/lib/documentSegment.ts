import type { RequirementDocumentItem } from '../types/requirement';

export function splitTextIntoChunks(text: string, chunkSize = 500): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  const paragraphs = normalized.split(/\n{2,}/).filter((p) => p.trim());

  if (paragraphs.length > 1) {
    let current = '';
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (current.length + trimmed.length > chunkSize && current.length > 0) {
        chunks.push(current.trim());
        current = trimmed;
      } else {
        current += (current ? '\n\n' : '') + trimmed;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    if (chunks.length > 0) return chunks;
  }

  const sentences = normalized.split(/(?<=[。！？.!?])\s*/).filter((s) => s.trim());
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmed;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  if (chunks.length === 0 && normalized.length > chunkSize) {
    for (let i = 0; i < normalized.length; i += chunkSize) {
      chunks.push(normalized.slice(i, i + chunkSize));
    }
  }

  return chunks.length > 0 ? chunks : [normalized];
}

export function buildDocumentSegments(
  documents: { name: string; text: string }[],
  description: string,
  chunkSize = 500
): RequirementDocumentItem[] {
  const items: RequirementDocumentItem[] = [];
  let order = 0;

  for (const doc of documents) {
    const text = doc.text?.trim();
    if (!text) continue;

    const chunks = splitTextIntoChunks(text, chunkSize);
    chunks.forEach((content, index) => {
      const currentOrder = order++;
      items.push({
        id: `seg-doc-${currentOrder}`,
        title:
          chunks.length > 1 ? `${doc.name} - 片段 ${index + 1}` : doc.name,
        content,
        source: 'file',
        sourceName: doc.name,
        order: currentOrder,
      });
    });
  }

  const desc = description.trim();
  if (desc) {
    const descChunks = splitTextIntoChunks(desc, chunkSize);
    descChunks.forEach((content, index) => {
      const currentOrder = order++;
      items.push({
        id: `seg-desc-${currentOrder}`,
        title:
          descChunks.length > 1 ? `需求描述 - 片段 ${index + 1}` : '需求描述',
        content,
        source: 'description',
        sourceName: '手动输入',
        order: currentOrder,
      });
    });
  }

  return items;
}

export function mergeSegmentsToDescription(items: RequirementDocumentItem[]): string {
  return items
    .sort((a, b) => a.order - b.order)
    .map((item) => `【${item.title}】\n${item.content}`)
    .join('\n\n');
}
