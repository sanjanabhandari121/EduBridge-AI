import { prisma } from "../utils/prisma";

export interface RetrievedChunk {
  content: string;
  title: string;
  source: string;
  url: string | null;
  score: number;
}

// Lightweight keyword-overlap retriever for the hackathon MVP.
// Swap `retrieve()` internals for pgvector/Qdrant/Chroma cosine-similarity search
// in production — the calling code (aiService) does not need to change.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export async function retrieve(query: string, topicId?: string, limit = 3): Promise<RetrievedChunk[]> {
  const chunks = await prisma.documentChunk.findMany({
    where: topicId ? { topicId } : undefined,
    include: { document: true },
  });

  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0 || chunks.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const keywordTokens: string[] = JSON.parse(chunk.keywords || "[]");
    const overlap = keywordTokens.filter((k) => queryTokens.has(k)).length;
    const score = overlap / Math.max(queryTokens.size, 1);
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      content: chunk.content,
      title: chunk.document.title,
      source: chunk.document.source,
      url: chunk.document.url,
      score: Number(score.toFixed(2)),
    }));
}
