import Groq from "groq-sdk";
import { MULTICHAIN_PLANNER_PROMPT } from "./prompt.js";
import { parsePlanJson } from "./planner.js";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is missing or still the placeholder. Add it to .env, or use --plan for offline mode."
    );
  }
  return new Groq({ apiKey });
}

export async function planWithGroq({
  request,
  registry,
  policy,
  client = createGroqClient(),
  model = process.env.GROQ_MODEL || "openai/gpt-oss-20b",
}) {
  if (typeof request !== "string" || !request.trim()) throw new Error("Goal request is empty.");
  const safeContext = {
    networks: registry.networks.map(({ id, name, family, testnet, nativeAsset }) => ({
      id,
      name,
      family,
      testnet,
      nativeAsset,
    })),
    policy: {
      testnetOnly: policy.testnetOnly,
      maxOperations: policy.maxOperations,
      allowedActions: policy.allowedActions,
      maxTransferByNetwork: policy.maxTransferByNetwork,
    },
  };
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 2048,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [
      { role: "system", content: MULTICHAIN_PLANNER_PROMPT },
      {
        role: "user",
        content: `Registry and policy:\n${JSON.stringify(safeContext, null, 2)}\n\nUser goal:\n${request.trim()}`,
      },
    ],
  });
  return parsePlanJson(completion.choices[0]?.message?.content ?? "");
}
