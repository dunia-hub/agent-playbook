import Groq from "groq-sdk";
import { GAS_EXPLANATION_PROMPT, validateExplanation } from "./prompt.js";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is missing or still the placeholder. Add it to .env, or omit --explain."
    );
  }
  return new Groq({ apiKey });
}

export async function explainFeeReport({
  report,
  client = createGroqClient(),
  model = process.env.GROQ_MODEL || "openai/gpt-oss-20b",
}) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 2048,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [
      { role: "system", content: GAS_EXPLANATION_PROMPT },
      { role: "user", content: JSON.stringify(report, null, 2) },
    ],
  });
  return validateExplanation(completion.choices[0]?.message?.content ?? "");
}
