import { Response, Request } from "express";
import { prisma } from "../utils/prisma";
import { retrieve } from "../rag/ragService";

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || "");
  if (!query) return res.status(400).json({ error: "Provide a search query as ?q=" });
  const results = await retrieve(query, undefined, 5);
  res.json({ results });
}

// Minimal ingestion endpoint: accepts pre-chunked text (a real pipeline would
// extract/clean/split a PDF or webpage first — the chunk+keyword step below is
// the reusable part regardless of source format).
export async function ingest(req: Request, res: Response) {
  const { title, subject, source, url, topicId, chunks } = req.body as {
    title: string; subject: string; source: string; url?: string; topicId?: string; chunks: string[];
  };
  if (!title || !source || !Array.isArray(chunks) || chunks.length === 0) {
    return res.status(400).json({ error: "title, source, and a non-empty chunks[] are required." });
  }
  const doc = await prisma.knowledgeDocument.create({
    data: {
      title,
      subject: subject || "General",
      source,
      url: url || null,
      chunks: {
        create: chunks.map((content: string) => ({
          content,
          topicId: topicId || null,
          keywords: JSON.stringify(
            Array.from(
              new Set(
                content
                  .toLowerCase()
                  .replace(/[^a-z0-9\s]/g, " ")
                  .split(/\s+/)
                  .filter((w) => w.length > 2)
              )
            )
          ),
        })),
      },
    },
    include: { chunks: true },
  });
  res.status(201).json({ document: doc });
}
