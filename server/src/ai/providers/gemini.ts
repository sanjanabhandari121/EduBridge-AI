import { AIProvider } from "./types";
import { env } from "../../utils/env";

// Real Gemini provider. Only used when AI_PROVIDER=gemini and GEMINI_API_KEY is set.
export const geminiProvider: AIProvider = {
  name: "gemini",
  async generateJSON(prompt: string): Promise<unknown> {
    if (!env.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env or switch AI_PROVIDER=mock.");
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content.");
    return JSON.parse(text);
  },
};
