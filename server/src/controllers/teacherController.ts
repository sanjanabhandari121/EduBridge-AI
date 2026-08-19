import { Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthedRequest } from "../middleware/auth";
import { classOverview, topicPerformanceBreakdown, weeklyEngagement } from "../services/analyticsService";

export async function dashboard(_req: AuthedRequest, res: Response) {
  const overview = await classOverview();
  const topicBreakdown = await topicPerformanceBreakdown();
  const engagement = await weeklyEngagement();
  res.json({ overview, topicBreakdown, engagement });
}

export async function students(_req: AuthedRequest, res: Response) {
  const profiles = await prisma.studentProfile.findMany({
    include: { user: true, masteryScores: { include: { topic: true } } },
  });

  const list = profiles.map((p) => {
    const avg = p.masteryScores.length
      ? p.masteryScores.reduce((s, m) => s + m.score, 0) / p.masteryScores.length
      : 0;
    const trendAvg = p.masteryScores.length
      ? p.masteryScores.reduce((s, m) => s + m.trend, 0) / p.masteryScores.length
      : 0;
    const daysSinceActive = Math.floor((Date.now() - p.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));

    let status: "MASTERED" | "STABLE" | "IMPROVING" | "MONITOR" | "NEEDS_ATTENTION" = "STABLE";
    if (avg >= 80) status = "MASTERED";
    else if (avg < 45 || daysSinceActive >= 5) status = "NEEDS_ATTENTION";
    else if (trendAvg < -5) status = "MONITOR";
    else if (trendAvg > 3) status = "IMPROVING";

    return {
      id: p.id,
      name: p.user.name,
      overallMastery: Math.round(avg),
      status,
      daysSinceActive,
      weakestTopic: p.masteryScores.sort((a, b) => a.score - b.score)[0]?.topic.name || null,
    };
  });

  res.json({ students: list });
}

export async function studentDetail(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const profile = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      masteryScores: { include: { topic: { include: { subject: true } } } },
      quizAttempts: { orderBy: { createdAt: "desc" }, take: 10 },
      alerts: { where: { resolved: false }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) return res.status(404).json({ error: "Student not found." });

  const weakest = [...profile.masteryScores].sort((a, b) => a.score - b.score)[0];
  const recommendedIntervention = weakest
    ? `${profile.user.name} has repeatedly struggled with ${weakest.topic.name} (${weakest.score}% mastery across ${weakest.attempts} attempts). Consider a short foundational refresher before assigning more advanced ${weakest.topic.subject.name} work.`
    : "No intervention needed right now — performance data is still building up.";

  res.json({
    id: profile.id,
    name: profile.user.name,
    email: profile.user.email,
    overallMastery: profile.masteryScores.length
      ? Math.round(profile.masteryScores.reduce((s, m) => s + m.score, 0) / profile.masteryScores.length)
      : 0,
    subjectPerformance: profile.masteryScores.map((m) => ({
      subject: m.topic.subject.name,
      topic: m.topic.name,
      score: m.score,
      trend: m.trend,
      attempts: m.attempts,
    })),
    recentQuizzes: profile.quizAttempts.map((q) => ({
      id: q.id,
      score: q.score,
      total: q.totalQuestions,
      accuracy: q.accuracy,
      date: q.createdAt,
    })),
    alerts: profile.alerts,
    recommendedIntervention,
  });
}

export async function alerts(_req: AuthedRequest, res: Response) {
  const alerts = await prisma.teacherAlert.findMany({
    where: { resolved: false },
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.user.name,
      severity: a.severity,
      message: a.message,
      createdAt: a.createdAt,
    })),
  });
}
