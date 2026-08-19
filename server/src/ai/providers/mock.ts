import { AIProvider } from "./types";
import { TutorPromptInput } from "../prompts/tutorPrompt";

// A fully offline, deterministic provider so the app is usable without any API key.
// It still respects the retrieved RAG context and student level/language — it just
// builds the structured response with templates instead of calling a real LLM.
// This is what AI_PROVIDER="mock" (the default) uses.
export const mockProvider: AIProvider = {
  name: "mock",
  async generateJSON(prompt: string): Promise<unknown> {
    // The tutor prompt is JSON-shaped text we authored ourselves, so we can pull
    // the pieces we need back out of it with light parsing instead of a real call.
    const questionMatch = prompt.match(/Question: "(.*)"/);
    const levelMatch = prompt.match(/Student level: (\w+)/);
    const languageMatch = prompt.match(/Preferred language: (\w+)/);
    const topicMatch = prompt.match(/Topic: (.*)/);
    const subjectMatch = prompt.match(/Subject: (.*)/);
    const weaknessMatch = prompt.match(/Known weak concepts: (.*)/);

    const question = questionMatch?.[1] || "your question";
    const level = (levelMatch?.[1] as TutorPromptInput["level"]) || "BEGINNER";
    const language = (languageMatch?.[1] as TutorPromptInput["language"]) || "ENGLISH";
    const topic = topicMatch?.[1]?.trim() || "this topic";
    const subject = subjectMatch?.[1]?.trim() || "this subject";

    const contextSection = prompt.split("Retrieved knowledge context")[1] || "";
    const hasContext = !contextSection.includes("No matching material found");
    const citations: { title: string; source: string; url: string | null }[] = [];
    if (hasContext) {
      const lines = contextSection.split("\n").filter((l) => /^\[\d+\]/.test(l.trim()));
      for (const line of lines.slice(0, 2)) {
        const sourceMatch = line.match(/\((.*?)\)/);
        if (sourceMatch) {
          citations.push({ title: topic, source: sourceMatch[1], url: null });
        }
      }
    }

    const isHinglish = language === "HINGLISH";
    const isHindi = language === "HINDI";

    const levelIntro =
      level === "BEGINNER"
        ? isHinglish
          ? `Chalo isse ekdum simple tareeke se samajhte hain.`
          : isHindi
            ? `आइए इसे बहुत सरल तरीके से समझते हैं।`
            : `Let's build this up from the basics, step by step.`
        : level === "INTERMEDIATE"
          ? isHinglish
            ? `Aap basics jaante ho, toh thoda application-level pe chalte hain.`
            : `You've got the basics, so let's push into how this applies.`
          : isHinglish
            ? `Chalo ismein thoda deep jaate hain aur edge cases bhi dekhte hain.`
            : `Let's go a level deeper, including edge cases and why the method works.`;

    const shortAnswer = isHinglish
      ? `"${question}" ka core idea: ${topic} ke basic concept ko step-by-step apply karna hai.`
      : isHindi
        ? `"${question}" का मूल विचार: ${topic} की अवधारणा को चरण दर चरण लागू करना है।`
        : `Here's the direct answer: work through "${question}" by applying the core idea of ${topic} one step at a time.`;

    const steps = [
      isHinglish ? `Pehle, identify karo ki ${topic} mein kaunsa concept use ho raha hai.` : `First, identify which concept within ${topic} the question is testing.`,
      isHinglish ? `Fir, known values/known steps likho aur unhe organize karo.` : `Next, write down what's known and organize it clearly.`,
      isHinglish ? `Ab step-by-step method apply karo, ek baar mein ek operation.` : `Apply the method one operation at a time — don't skip steps.`,
      isHinglish ? `Answer ko verify karo, substitute karke check karo ki sahi hai.` : `Check your answer by substituting it back or sanity-testing it.`,
    ];

    return {
      shortAnswer,
      letsUnderstand: `${levelIntro} ${topic} in ${subject} is about recognizing the pattern and applying a reliable, repeatable method rather than memorizing one example.`,
      steps,
      whyThisWorks: isHinglish
        ? `Ye method isliye kaam karta hai kyunki hum problem ko chhote, predictable steps mein tod rahe hain.`
        : `This works because we're breaking the problem into small, predictable steps that build on each other logically.`,
      commonMistake: `A common mistake students make with ${topic} is rushing to the answer without checking each intermediate step — that's usually where small errors creep in.`,
      tryThis: isHinglish
        ? `Ek similar question try karo: isi topic ka ek aur example khud solve karke dekho.`
        : `Try a similar problem on your own using the same ${topic} method before checking the solution.`,
      citations,
    };
  },
};
