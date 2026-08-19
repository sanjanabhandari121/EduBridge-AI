export type Role = "STUDENT" | "TEACHER";
export type Language = "ENGLISH" | "HINDI" | "HINGLISH";
export type ExplanationLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface WeakArea {
  topicId: string;
  topic: string;
  subject: string;
  score: number;
  trend: number;
}

export interface StudentDashboard {
  name: string;
  overallScore: number;
  streakDays: number;
  questionsSolved: number;
  topicsMastered: number;
  continueLearning: { topic: string; subject: string; mastery: number; lastActivity: string }[];
  weakAreas: WeakArea[];
}

export interface TutorResponse {
  shortAnswer: string;
  letsUnderstand: string;
  steps: string[];
  whyThisWorks: string;
  commonMistake: string;
  tryThis: string;
  citations: { title: string; source: string; url: string | null }[];
  sourceNote?: string;
}

export interface PracticeQuestion {
  id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  difficulty: number;
}

export interface Subject {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

export interface TeacherStudent {
  id: string;
  name: string;
  overallMastery: number;
  status: "MASTERED" | "STABLE" | "IMPROVING" | "MONITOR" | "NEEDS_ATTENTION";
  daysSinceActive: number;
  weakestTopic: string | null;
}
