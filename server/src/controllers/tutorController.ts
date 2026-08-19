import { Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AuthedRequest } from "../middleware/auth";
import { retrieve } from "../rag/ragService";
import { generateExplanation } from "../ai/aiService";
import { getWeakTopics } from "../services/masteryService";

const askSchema = z.object({
  question: z.string().min(3, "Ask a full question so the tutor has something to work with."),
  subject: z.string().optional(),
  topicId: z.string().optional(),
  language: z.enum(["ENGLISH", "HINDI", "HINGLISH"]).default("ENGLISH"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
});

export async function ask(req: AuthedRequest, res: Response) {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request." });
  }
  const { question, subject, topicId, language, level } = parsed.data;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  let topicName: string | undefined;
  if (topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    topicName = topic?.name;
  }

  const context = await retrieve(question, topicId, 3);
  const weak = await getWeakTopics(profile.id, 3);

  const response = await generateExplanation({
    question,
    subject,
    topic: topicName,
    language,
    level,
    knownWeaknesses: weak.map((w) => w.topic),
    context,
  });

  await prisma.learningSession.create({
    data: {
      studentId: profile.id,
      question,
      answer: response.shortAnswer,
      subject,
      topic: topicName,
      language,
      level,
      citations: JSON.stringify(response.citations),
    },
  });

  res.json({
    ...response,
    sourceNote:
      response.citations.length === 0
        ? "Source not found in the current knowledge base."
        : undefined,
  });
}

export async function history(req: AuthedRequest, res: Response) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const sessions = await prisma.learningSession.findMany({
    where: { studentId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      question: s.question,
      answer: s.answer,
      topic: s.topic,
      createdAt: s.createdAt,
    })),
  });
}
