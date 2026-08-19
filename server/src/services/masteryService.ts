import { prisma } from "../utils/prisma";
import { computeMastery, nextDifficulty } from "./masteryMath";

export { computeMastery, nextDifficulty };

export async function updateMasteryForAnswer(
  studentId: string,
  topicId: string,
  isCorrect: boolean
) {
  const existing = await prisma.masteryScore.findUnique({
    where: { studentId_topicId: { studentId, topicId } },
  });

  const previousScore = existing?.score ?? 50;
  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (isCorrect ? 1 : 0);
  const newScore = computeMastery({ previousScore, isCorrect, attemptsSoFar: existing?.attempts ?? 0 });
  const trend = newScore - previousScore;

  return prisma.masteryScore.upsert({
    where: { studentId_topicId: { studentId, topicId } },
    update: { score: newScore, attempts, correct, trend, lastAttemptAt: new Date() },
    create: { studentId, topicId, score: newScore, attempts, correct, trend },
  });
}

export async function getWeakTopics(studentId: string, limit = 3) {
  const scores = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { topic: { include: { subject: true } } },
    orderBy: { score: "asc" },
    take: limit,
  });
  return scores.map((s) => ({
    topicId: s.topicId,
    topic: s.topic.name,
    subject: s.topic.subject.name,
    score: s.score,
    trend: s.trend,
  }));
}

