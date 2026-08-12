// Talks to Groq. Loads env, builds the request, returns the model's text.
import 'dotenv/config';
import Groq from 'groq-sdk';
import { SYSTEM_PROMPT } from './prompt.js';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Fail loudly and early if the key is missing or still the placeholder.
if (!apiKey || apiKey === 'your_groq_api_key_here') {
  throw new Error(
    'GROQ_API_KEY is missing or still the placeholder. Add your real key to .env'
  );
}

const client = new Groq({ apiKey });

// Send one raw brain-dump to the model and return its Markdown answer.
export async function untangle(rawText) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0, // deterministic-ish; discourages the model from embellishing
    // gpt-oss is a reasoning model. Without a high cap it can spend the whole
    // budget "thinking" and return empty content. Give it room, keep thinking
    // low for this structuring task, and keep reasoning OUT of the answer.
    max_completion_tokens: 4096,
    reasoning_effort: 'low',
    reasoning_format: 'hidden',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
}

export { model as GROQ_MODEL };
