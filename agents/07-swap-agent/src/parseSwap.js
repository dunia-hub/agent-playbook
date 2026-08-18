import { groq } from "./groq.js";
import { config } from "./config.js";
import { SWAP_PROMPT } from "./prompt.js";

export async function parseSwapRequest(userInput) {
  if (!userInput || !userInput.trim()) {
    throw new Error("Swap request cannot be empty.");
  }

  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      {
        role: "system",
        content: SWAP_PROMPT,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
    response_format: {
      type: "json_object",
    },
    reasoning_effort: "low",
    include_reasoning: false,
    temperature: 0.2,
  });

  const response = completion.choices[0]?.message?.content;

  if (!response?.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return JSON.parse(response);
}
