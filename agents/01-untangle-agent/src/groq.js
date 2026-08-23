// Talks to Groq. Loads env, builds the request, returns the model's text.
// Supports model fallback, deprecation warnings, and JSON structured outputs.
import 'dotenv/config';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT, REQUIRED_SECTIONS } from './prompt.js';

const apiKey = process.env.GROQ_API_KEY;
const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Fail loudly and early if the key is missing or still the placeholder.
if (!apiKey || apiKey === 'your_groq_api_key_here') {
  throw new Error(
    'GROQ_API_KEY is missing or still the placeholder. Add your real key to .env'
  );
}

const client = new Groq({ apiKey });

// Known deprecated or problematic models that should trigger a warning.
const DEPRECATED_MODELS = new Set([
  'openai/gpt-oss-20b', // example: mark as deprecated if needed
]);

// Fallback chain: try primary, then fallbacks.
const FALLBACK_CHAIN = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

function getModelList() {
  // Return the fallback chain, with the primary model first if not deprecated.
  if (DEPRECATED_MODELS.has(primaryModel)) {
    console.error(
      `Warning: model "${primaryModel}" is deprecated. Using fallback chain.`
    );
    return FALLBACK_CHAIN.filter((m) => m !== primaryModel);
  }
  return [primaryModel, ...FALLBACK_CHAIN.filter((m) => m !== primaryModel)];
}

// Retry once if the model returns empty content (a known issue with reasoning
// models that spend their token budget on thinking).
async function callWithRetry(messages, model, attempt = 1) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 4096,
    reasoning_effort: 'low',
    reasoning_format: 'hidden',
    messages,
  });
  const content = completion.choices[0]?.message?.content ?? '';

  if (!content.trim() && attempt === 1) {
    // Retry once with a nudge to produce output.
    return callWithRetry(
      [
        ...messages,
        {
          role: 'user',
          content:
            'Your previous response was empty. Please provide the structured output now.',
        },
      ],
      model,
      attempt + 1
    );
  }

  return content;
}

// Build a JSON schema for structured outputs matching the required sections.
function buildJsonSchema() {
  const sectionProperties = {};
  for (const section of REQUIRED_SECTIONS) {
    sectionProperties[section] = {
      type: 'array',
      items: { type: 'string' },
      description: `Bullet points for the ${section} section.`,
    };
  }

  return {
    type: 'object',
    properties: sectionProperties,
    required: REQUIRED_SECTIONS,
    additionalProperties: false,
  };
}

// Try each model in the chain until one succeeds.
export async function untangle(rawText, jsonMode = false) {
  const models = getModelList();
  let lastError;

  for (const model of models) {
    try {
      console.error(`Trying model: ${model}`);
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawText },
      ];

      if (jsonMode) {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0,
          max_completion_tokens: 4096,
          reasoning_effort: 'low',
          reasoning_format: 'hidden',
          messages,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'untangle_response',
              strict: true,
              schema: buildJsonSchema(),
            },
          },
        });
        const content = completion.choices[0]?.message?.content ?? '';
        if (content.trim()) {
          return JSON.parse(content);
        }
      } else {
        const result = await callWithRetry(messages, model);
        if (result.trim()) {
          return result;
        }
      }
    } catch (err) {
      lastError = err;
      console.error(`Model ${model} failed: ${err.message}`);
      continue;
    }
  }

  throw new Error(
    `All models failed. Last error: ${lastError?.message ?? 'unknown'}`
  );
}

export { primaryModel as GROQ_MODEL };
