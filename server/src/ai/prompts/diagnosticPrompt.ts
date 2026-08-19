export function buildDiagnosticPrompt(topic: string, stats: {
  accuracy: number; attempts: number; recentTrend: number;
}): string {
  return `A student has ${stats.attempts} attempts on "${topic}" with ${(stats.accuracy * 100).toFixed(0)}%
accuracy and a recent trend of ${stats.recentTrend >= 0 ? "improving" : "declining"}.
In 2-3 sentences, write an encouraging, specific, non-judgmental diagnostic note a teacher
could read, using only this data. Do not infer anything about the student's personal life,
ability, or health.`;
}
