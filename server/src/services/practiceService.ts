import { prisma } from "../utils/prisma";
import { updateMasteryForAnswer, nextDifficulty } from "./masteryService";

export async function generatePracticeSet(topicId: string, count: number, targetDifficulty?: number) {
  const questions = await prisma.question.findMany({
    where: { topicId, ...(targetDifficulty ? { difficulty: targetDifficulty } : {}) },
    take: count,
  });
  // If not enough questions at the exact difficulty, backfill from the whole topic bank.
  if (questions.length < count) {
    const fallback = await prisma.question.findMany({ where: { topicId }, take: count });
    return fallback;
  }
  return questions;
}

export interface SubmittedAnswer {
  questionId: string;
  studentAnswer: string;
  timeTakenSec?: number;
  hintUsed?: boolean;
}

export async function submitPractice(
  studentId: string,
  topicId: string,
  durationSec: number,
  answers: SubmittedAnswer[]
) {
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const quiz = await prisma.quiz.create({ data: { studentId, topicId } });

  let correctCount = 0;
  const results = [];
  let runningDifficulty = questions[0]?.difficulty ?? 1;
  const recentResults: boolean[] = [];

  for (const a of answers) {
    const q = questionMap.get(a.questionId);
    if (!q) continue;
    const isCorrect = q.answer.trim().toLowerCase() === a.studentAnswer.trim().toLowerCase();
    if (isCorrect) correctCount++;
    recentResults.push(isCorrect);
    runningDifficulty = nextDifficulty(runningDifficulty, recentResults);

    const mastery = await updateMasteryForAnswer(studentId, topicId, isCorrect);

    results.push({
      questionId: q.id,
      prompt: q.prompt,
      isCorrect,
      correctAnswer: q.answer,
      explanation: q.explanation,
      newMasteryScore: mastery.score,
    });
  }

  const quizAttempt = await prisma.quizAttempt.create({
    data: {
      studentId,
      quizId: quiz.id,
      score: correctCount,
      totalQuestions: answers.length,
      accuracy: answers.length ? correctCount / answers.length : 0,
      durationSec,
      answers: {
        create: answers
          .filter((a) => questionMap.has(a.questionId))
          .map((a) => ({
            questionId: a.questionId,
            studentAnswer: a.studentAnswer,
            isCorrect:
              questionMap.get(a.questionId)!.answer.trim().toLowerCase() ===
              a.studentAnswer.trim().toLowerCase(),
            timeTakenSec: a.timeTakenSec || 0,
            hintUsed: a.hintUsed || false,
          })),
      },
    },
  });

  return { quizAttempt, results, correctCount, total: answers.length, nextDifficulty: runningDifficulty };
}
