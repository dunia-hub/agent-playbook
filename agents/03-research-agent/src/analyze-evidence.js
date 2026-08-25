import { waitForRateLimit } from "./rate-limit.js";
import { buildEvidencePrompt } from "./evidence-prompt.js";
import { EVIDENCE_RESPONSE_FORMAT } from "./evidence-schema.js";
import {
  parseEvidenceAnalysis,
  validateEvidenceAnalysis,
} from "./evidence-validator.js";

function readResponseContent(response) {
  const content = response?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Groq returned an empty evidence analysis.");
  }

  return content;
}

export async function analyzeEvidence({
  plan,
  sources,
  client,
  model,
  currentDate = new Date().toISOString().slice(0, 10),
}) {
  if (!client?.chat?.completions?.create) {
    throw new Error("A valid Groq client is required.");
  }

  if (typeof model !== "string" || model.trim() === "") {
    throw new Error("GROQ_MODEL is required.");
  }

  const analyzedSources = sources.slice(0, 4);
  const prompt = buildEvidencePrompt({
    plan,
    sources: analyzedSources,
    currentDate,
  });

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const retryInstruction =
        attempt === 1
          ? ""
          : `\n\nYour previous response failed validation: ${lastError?.message}. Correct it and return only valid JSON. Every excerpt must appear exactly in its source.`;

      const response = await client.chat.completions.create({
        model: model.trim(),
        temperature: 0.1,
        reasoning_effort: "low",
        include_reasoning: false,
        max_completion_tokens: 1600,
        response_format: EVIDENCE_RESPONSE_FORMAT,
        messages: [
          {
            role: "user",
            content: `${prompt}${retryInstruction}`,
          },
        ],
      });

      const content = readResponseContent(response);
      const parsed = parseEvidenceAnalysis(content);

      return validateEvidenceAnalysis(parsed, analyzedSources);
    } catch (error) {
      lastError = error;

      if (attempt < 2) {
        await waitForRateLimit(error);
      }
    }
  }

  throw new Error(
    `Unable to produce valid evidence analysis after 2 attempts: ${lastError.message}`,
  );
}
