export interface QuizPromptInput {
  topic: string;
  difficulty: number; // 1-4
  count: number;
  language: "ENGLISH" | "HINDI" | "HINGLISH";
}

export function buildQuizPrompt(input: QuizPromptInput): string {
  return `Generate ${input.count} practice questions for the topic "${input.topic}" at
difficulty level ${input.difficulty} (1=basic concept, 2=direct application,
3=multi-step problem, 4=advanced/application). Language: ${input.language}.

Respond ONLY with strict JSON: an array of objects shaped as:
{ "type": "MCQ"|"NUMERIC"|"CONCEPTUAL"|"SHORT_ANSWER", "prompt": string,
  "options": string[] | null, "answer": string, "explanation": string, "difficulty": number }`;
}
