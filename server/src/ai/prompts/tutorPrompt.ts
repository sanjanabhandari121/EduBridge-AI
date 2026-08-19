import { RetrievedChunk } from "../../rag/ragService";

export interface TutorPromptInput {
  question: string;
  subject?: string;
  topic?: string;
  language: "ENGLISH" | "HINDI" | "HINGLISH";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  knownWeaknesses: string[];
  context: RetrievedChunk[];
}

export function buildTutorPrompt(input: TutorPromptInput): string {
  const contextBlock = input.context.length
    ? input.context.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join("\n")
    : "No matching material found in the knowledge base.";

  return `You are an expert, encouraging tutor for a school student. Never dump an advanced
definition on a beginner — meet them at their level and build up.

Student level: ${input.level}
Subject: ${input.subject || "General"}
Topic: ${input.topic || "Unknown"}
Preferred language: ${input.language}
Known weak concepts: ${input.knownWeaknesses.join(", ") || "None recorded yet"}
Question: "${input.question}"

Retrieved knowledge context (use this to ground your answer; cite it, never invent sources):
${contextBlock}

Respond ONLY with strict JSON matching this shape:
{
  "shortAnswer": string,
  "letsUnderstand": string,
  "steps": string[],
  "whyThisWorks": string,
  "commonMistake": string,
  "tryThis": string,
  "citations": [{ "title": string, "source": string, "url": string | null }]
}
If no context was retrieved, set citations to [] and do not fabricate a source.
If language is HINGLISH, mix Hindi and English naturally but keep technical terms and
notation in English/standard form.`;
}
