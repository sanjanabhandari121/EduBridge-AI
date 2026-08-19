import { Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AuthedRequest } from "../middleware/auth";
import { generatePracticeSet, submitPractice } from "../services/practiceService";
import { refreshTeacherAlerts } from "../services/recommendationService";
import { analyzePerformance } from "../ai/aiService";

const generateSchema = z.object({
  topicId: z.string(),
  count: z.number().int().min(1).max(10).default(5),
  difficulty: z.number().int().min(1).max(4).optional(),
});

export async function generate(req: AuthedRequest, res: Response) {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid topicId and question count." });
  const { topicId, count, difficulty } = parsed.data;

  const questions = await generatePracticeSet(topicId, count, difficulty);
  if (questions.length === 0) {
    return res.status(404).json({ error: "No practice questions available for this topic yet." });
  }
  // Never expose the correct answer before submission.
  res.json({
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options ? JSON.parse(q.options) : null,
      difficulty: q.difficulty,
    })),
  });
}

const submitSchema = z.object({
  topicId: z.string(),
  durationSec: z.number().int().min(0).default(0),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        studentAnswer: z.string(),
        timeTakenSec: z.number().optional(),
        hintUsed: z.boolean().optional(),
      })
    )
    .min(1, "Submit at least one answer."),
});

export async function submit(req: AuthedRequest, res: Response) {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid submission." });
  }
  const { topicId, durationSec, answers } = parsed.data;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const result = await submitPractice(profile.id, topicId, durationSec, answers);

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { lastActiveAt: new Date() },
  });

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  const mastery = await prisma.masteryScore.findUnique({
    where: { studentId_topicId: { studentId: profile.id, topicId } },
  });

  const recommendation = await analyzePerformance(topic?.name || "this topic", {
    accuracy: result.correctCount / result.total,
    attempts: mastery?.attempts ?? result.total,
    recentTrend: mastery?.trend ?? 0,
  });

  await refreshTeacherAlerts(profile.id);

  res.json({
    score: result.correctCount,
    total: result.total,
    accuracy: result.total ? result.correctCount / result.total : 0,
    results: result.results,
    newMasteryScore: mastery?.score ?? null,
    recommendation,
    nextDifficulty: result.nextDifficulty,
  });
}
