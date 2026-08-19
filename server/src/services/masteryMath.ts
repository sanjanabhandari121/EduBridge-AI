// Pure, dependency-free mastery math — kept separate from masteryService.ts
// (which needs the Prisma client) so this logic can be unit tested without
// a database or generated client.

// MVP diagnostic heuristic — NOT a scientifically validated psychometric model.
export function computeMastery(params: {
  previousScore: number;
  isCorrect: boolean;
  attemptsSoFar: number;
}): number {
  const { previousScore, isCorrect, attemptsSoFar } = params;
  const learningRate = Math.max(0.08, 0.3 - attemptsSoFar * 0.01); // slows down as more data comes in
  const target = isCorrect ? 100 : Math.max(0, previousScore - 15);
  const next = previousScore + (target - previousScore) * learningRate;
  return Math.max(0, Math.min(100, Math.round(next)));
}

// Adaptive difficulty: 1-4, moves up after streaks of correct answers,
// down after repeated misses.
export function nextDifficulty(currentDifficulty: number, recentResults: boolean[]): number {
  const lastThree = recentResults.slice(-3);
  const allCorrect = lastThree.length === 3 && lastThree.every(Boolean);
  const allWrong = lastThree.length >= 2 && lastThree.slice(-2).every((r) => !r);
  if (allCorrect) return Math.min(4, currentDifficulty + 1);
  if (allWrong) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}
