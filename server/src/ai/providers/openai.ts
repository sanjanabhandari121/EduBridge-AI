import { AIProvider } from "./types";
import { env } from "../../utils/env";

// Real OpenAI-compatible provider. Only used when AI_PROVIDER=openai and OPENAI_API_KEY is set.
export const openaiProvider: AIProvider = {
  name: "openai",
  async generateJSON(prompt: string): Promise<unknown> {
    if (!env.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not set. Add it to .env or switch AI_PROVIDER=mock.");
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned no content.");
    return JSON.parse(text);
  },
};
