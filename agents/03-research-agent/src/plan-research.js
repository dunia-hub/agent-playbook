import { waitForRateLimit } from "./rate-limit.js";
import { buildPlannerPrompt, validateResearchQuestion } from "./planner.js";
import {
  parseResearchPlan,
  validateResearchPlan,
} from "./plan-validator.js";

function readResponseContent(response) {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Groq returned an empty research plan.");
  }

  return content;
}

export async function createResearchPlan({
  question,
  client,
  model,
  currentDate = new Date().toISOString().slice(0, 10),
}) {
  const cleanedQuestion = validateResearchQuestion(question);

  if (!client?.chat?.completions?.create) {
    throw new Error("A valid Groq client is required.");
  }

  if (typeof model !== "string" || model.trim() === "") {
    throw new Error("GROQ_MODEL is required.");
  }

  const prompt = buildPlannerPrompt(cleanedQuestion, currentDate);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const retryInstruction =
        attempt === 1
          ? ""
          : "\n\nYour previous response was invalid. Return only the exact JSON structure requested.";

      const response = await client.chat.completions.create({
        model: model.trim(),
        temperature: 0.1,
        reasoning_effort: "low",
        include_reasoning: false,
        max_completion_tokens: 1000,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "user",
            content: `${prompt}${retryInstruction}`,
          },
        ],
      });

      const content = readResponseContent(response);
      const parsed = parseResearchPlan(content);

      return validateResearchPlan(parsed, cleanedQuestion);
    } catch (error) {
      lastError = error;

      if (attempt < 2) {
        await waitForRateLimit(error);
      }
    }
  }

  throw new Error(
    `Unable to create a valid research plan after 2 attempts: ${lastError.message}`,
  );
}
