import { describe, it, expect } from "vitest";
import { computeMastery, nextDifficulty } from "../services/masteryMath";

describe("computeMastery", () => {
  it("increases mastery on a correct answer", () => {
    const result = computeMastery({ previousScore: 50, isCorrect: true, attemptsSoFar: 2 });
    expect(result).toBeGreaterThan(50);
  });

  it("decreases mastery on an incorrect answer", () => {
    const result = computeMastery({ previousScore: 50, isCorrect: false, attemptsSoFar: 2 });
    expect(result).toBeLessThan(50);
  });

  it("clamps mastery between 0 and 100", () => {
    const high = computeMastery({ previousScore: 99, isCorrect: true, attemptsSoFar: 0 });
    const low = computeMastery({ previousScore: 1, isCorrect: false, attemptsSoFar: 0 });
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("slows down learning rate as attempts accumulate", () => {
    const earlyJump = computeMastery({ previousScore: 50, isCorrect: true, attemptsSoFar: 0 });
    const laterJump = computeMastery({ previousScore: 50, isCorrect: true, attemptsSoFar: 20 });
    expect(earlyJump - 50).toBeGreaterThan(laterJump - 50);
  });
});

describe("nextDifficulty", () => {
  it("increases difficulty after three correct answers in a row", () => {
    expect(nextDifficulty(2, [true, true, true])).toBe(3);
  });

  it("decreases difficulty after two wrong answers in a row", () => {
    expect(nextDifficulty(2, [true, false, false])).toBe(1);
  });

  it("holds difficulty steady on mixed results", () => {
    expect(nextDifficulty(2, [true, false, true])).toBe(2);
  });

  it("never goes below 1 or above 4", () => {
    expect(nextDifficulty(1, [false, false])).toBe(1);
    expect(nextDifficulty(4, [true, true, true])).toBe(4);
  });
});
