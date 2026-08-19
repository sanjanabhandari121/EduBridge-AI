import { prisma } from "../utils/prisma";

export async function classOverview() {
  const students = await prisma.studentProfile.findMany({ include: { masteryScores: true } });
  let doingWell = 0, improving = 0, needsAttention = 0;

  for (const s of students) {
    if (s.masteryScores.length === 0) continue;
    const avg = s.masteryScores.reduce((sum, m) => sum + m.score, 0) / s.masteryScores.length;
    const trendAvg = s.masteryScores.reduce((sum, m) => sum + m.trend, 0) / s.masteryScores.length;
    if (avg < 50 || trendAvg < -8) needsAttention++;
    else if (trendAvg > 3) improving++;
    else doingWell++;
  }

  return { totalStudents: students.length, doingWell, improving, needsAttention };
}

export async function topicPerformanceBreakdown() {
  const scores = await prisma.masteryScore.findMany({ include: { topic: true } });
  const byTopic = new Map<string, { total: number; count: number }>();
  for (const s of scores) {
    const entry = byTopic.get(s.topic.name) || { total: 0, count: 0 };
    entry.total += s.score;
    entry.count += 1;
    byTopic.set(s.topic.name, entry);
  }
  return Array.from(byTopic.entries()).map(([topic, { total, count }]) => ({
    topic,
    averageMastery: Math.round(total / count),
  }));
}

export async function weeklyEngagement() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const attempts = await prisma.quizAttempt.findMany({ where: { createdAt: { gte: since } } });
  const byDay = new Map<string, number>();
  for (const a of attempts) {
    const day = a.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }
  return Array.from(byDay.entries()).map(([day, count]) => ({ day, quizzesTaken: count }));
}
