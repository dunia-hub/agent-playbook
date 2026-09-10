import Groq from "groq-sdk";
import { MESSAGE_ANALYSIS_PROMPT } from "./prompt.js";
import { parseModelJson, validateAnalysis } from "./analysis.js";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is missing or still the placeholder. Add it to .env, or use --analysis for offline mode."
    );
  }
  return new Groq({ apiKey });
}

export async function analyzeMessageWithGroq({
  redactedText,
  supportedLanguages,
  client = createGroqClient(),
  model = process.env.GROQ_MODEL || "openai/gpt-oss-20b",
}) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 1024,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [
      { role: "system", content: MESSAGE_ANALYSIS_PROMPT },
      {
        role: "user",
        content: `Supported languages: ${supportedLanguages.join(", ")}\nRedacted message: ${redactedText}`,
      },
    ],
  });
  return validateAnalysis(
    parseModelJson(completion.choices[0]?.message?.content ?? "")
  );
}
