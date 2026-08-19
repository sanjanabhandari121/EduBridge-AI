import { prisma } from "../utils/prisma";
import { AlertSeverity } from "@prisma/client";

// Generates non-judgmental teacher alerts from actual activity data only.
// These are recommendations for a teacher to review, never automated decisions
// about the student, per the spec's safety requirements.
export async function refreshTeacherAlerts(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { masteryScores: { include: { topic: true } } },
  });
  if (!student) return [];

  const newAlerts: { severity: AlertSeverity; message: string; reason: string }[] = [];
  const daysSinceActive = Math.floor(
    (Date.now() - student.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActive >= 5) {
    newAlerts.push({
      severity: "WATCH",
      message: `No practice activity in ${daysSinceActive} days.`,
      reason: "inactivity",
    });
  }

  for (const m of student.masteryScores) {
    if (m.score < 45 && m.attempts >= 3) {
      newAlerts.push({
        severity: "ATTENTION",
        message: `Struggling with ${m.topic.name} (${m.score}% mastery across ${m.attempts} attempts).`,
        reason: "low-mastery",
      });
    } else if (m.trend <= -10) {
      newAlerts.push({
        severity: "WATCH",
        message: `Performance in ${m.topic.name} dropped recently (trend ${m.trend.toFixed(0)}).`,
        reason: "declining-trend",
      });
    }
  }

  // Avoid spamming: only create alerts that don't already exist unresolved.
  const existing = await prisma.teacherAlert.findMany({ where: { studentId, resolved: false } });
  const existingMessages = new Set(existing.map((e) => e.message));
  const toCreate = newAlerts.filter((a) => !existingMessages.has(a.message));

  if (toCreate.length) {
    await prisma.teacherAlert.createMany({
      data: toCreate.map((a) => ({ studentId, ...a })),
    });
  }

  return prisma.teacherAlert.findMany({ where: { studentId, resolved: false }, orderBy: { createdAt: "desc" } });
}
