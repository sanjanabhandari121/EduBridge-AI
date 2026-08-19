import { env } from "../utils/env";
import { mockProvider } from "./providers/mock";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import { AIProvider } from "./providers/types";
import { buildTutorPrompt, TutorPromptInput } from "./prompts/tutorPrompt";
import { buildQuizPrompt, QuizPromptInput } from "./prompts/quizPrompt";
import { buildDiagnosticPrompt } from "./prompts/diagnosticPrompt";

// The rest of the app should ONLY ever call the exported functions below —
// never reach into a specific provider directly. That keeps EduBridge
// provider-independent: switching AI_PROVIDER in .env is the only change needed.
function getProvider(): AIProvider {
  if (env.aiProvider === "gemini") return geminiProvider;
  if (env.aiProvider === "openai") return openaiProvider;
  return mockProvider;
}

export interface TutorResponse {
  shortAnswer: string;
  letsUnderstand: string;
  steps: string[];
  whyThisWorks: string;
  commonMistake: string;
  tryThis: string;
  citations: { title: string; source: string; url: string | null }[];
}

function validateTutorResponse(raw: unknown): TutorResponse {
  const r = raw as Partial<TutorResponse>;
  if (
    !r ||
    typeof r.shortAnswer !== "string" ||
    typeof r.letsUnderstand !== "string" ||
    !Array.isArray(r.steps)
  ) {
    // Malformed model output — never trust it blindly, fall back to a safe shape.
    return {
      shortAnswer: "I wasn't able to fully process that — could you rephrase your question?",
      letsUnderstand: "",
      steps: [],
      whyThisWorks: "",
      commonMistake: "",
      tryThis: "",
      citations: [],
    };
  }
  return {
    shortAnswer: r.shortAnswer,
    letsUnderstand: r.letsUnderstand,
    steps: r.steps,
    whyThisWorks: r.whyThisWorks || "",
    commonMistake: r.commonMistake || "",
    tryThis: r.tryThis || "",
    citations: Array.isArray(r.citations) ? r.citations : [],
  };
}

export async function generateExplanation(input: TutorPromptInput): Promise<TutorResponse> {
  const provider = getProvider();
  const prompt = buildTutorPrompt(input);
  try {
    const raw = await provider.generateJSON(prompt);
    return validateTutorResponse(raw);
  } catch (err) {
    console.error(`AI provider (${provider.name}) failed, falling back to mock:`, err);
    // Graceful degradation: if a configured real provider fails (bad key, network),
    // fall back to the offline mock rather than showing the student an error.
    const raw = await mockProvider.generateJSON(prompt);
    return validateTutorResponse(raw);
  }
}

export interface GeneratedQuestion {
  type: string;
  prompt: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  difficulty: number;
}

export async function generateQuestions(input: QuizPromptInput): Promise<GeneratedQuestion[]> {
  // For the MVP demo, question generation draws from the seeded question bank
  // (see practiceService) rather than a live model call, so results are
  // instant and always pedagogically reviewed. The AI prompt scaffold below is
  // wired up and ready for a live provider swap.
  void buildQuizPrompt(input);
  return [];
}

export async function analyzePerformance(
  topic: string,
  stats: { accuracy: number; attempts: number; recentTrend: number }
): Promise<string> {
  const provider = getProvider();
  const prompt = buildDiagnosticPrompt(topic, stats);
  try {
    if (provider.name === "mock") {
      const direction = stats.recentTrend >= 0 ? "improving" : "needs a closer look";
      return `Based on ${stats.attempts} recent attempts on ${topic} (${(stats.accuracy * 100).toFixed(
        0
      )}% accuracy), this student is currently ${direction}. Consider a short targeted practice set before moving to the next topic.`;
    }
    const raw = await provider.generateJSON(prompt);
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch (err) {
    console.error("analyzePerformance failed:", err);
    return `Performance summary unavailable right now for ${topic}. Raw stats: ${(stats.accuracy * 100).toFixed(
      0
    )}% accuracy over ${stats.attempts} attempts.`;
  }
}
