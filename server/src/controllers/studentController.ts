import { Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthedRequest } from "../middleware/auth";
import { getWeakTopics } from "../services/masteryService";

async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId }, include: { user: true } });
}

export async function dashboard(req: AuthedRequest, res: Response) {
  const profile = await getStudentProfile(req.user!.userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId: profile.id },
    include: { topic: { include: { subject: true } } },
    orderBy: { lastAttemptAt: "desc" },
  });

  const overallScore = masteryScores.length
    ? Math.round(masteryScores.reduce((sum, m) => sum + m.score, 0) / masteryScores.length)
    : 0;

  const questionsSolved = await prisma.answerAttempt.count({
    where: { quizAttempt: { studentId: profile.id } },
  });

  const topicsMastered = masteryScores.filter((m) => m.score >= 80).length;

  const weakTopics = await getWeakTopics(profile.id, 3);

  res.json({
    name: profile.user.name,
    overallScore,
    streakDays: profile.streakDays,
    questionsSolved,
    topicsMastered,
    continueLearning: masteryScores.slice(0, 4).map((m) => ({
      topic: m.topic.name,
      subject: m.topic.subject.name,
      mastery: m.score,
      lastActivity: m.lastAttemptAt,
    })),
    weakAreas: weakTopics,
  });
}

export async function progress(req: AuthedRequest, res: Response) {
  const profile = await getStudentProfile(req.user!.userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId: profile.id },
    include: { topic: { include: { subject: true } } },
  });
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  res.json({
    masteryBySubject: masteryScores.map((m) => ({
      subject: m.topic.subject.name,
      topic: m.topic.name,
      score: m.score,
      trend: m.trend,
    })),
    recentAttempts: recentAttempts.map((a) => ({
      id: a.id,
      score: a.score,
      total: a.totalQuestions,
      accuracy: a.accuracy,
      date: a.createdAt,
    })),
  });
}

export async function weakTopics(req: AuthedRequest, res: Response) {
  const profile = await getStudentProfile(req.user!.userId);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });
  const weak = await getWeakTopics(profile.id, 5);
  res.json({ weakTopics: weak });
}
