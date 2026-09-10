import Groq from "groq-sdk";
import { buildMessages } from "./prompt.js";
import { parseAgentResponse, validateAgentResult } from "./validate.js";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey) throw new Error("GROQ_API_KEY is required when --response is not used.");
  return new Groq({ apiKey });
}

export async function runWithGroq({ input, client, model = "llama-3.1-8b-instant" }) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: buildMessages(input),
  });
  const content = completion.choices?.[0]?.message?.content;
  return validateAgentResult(parseAgentResponse(content));
}
