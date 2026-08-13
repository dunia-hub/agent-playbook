import Groq from "groq-sdk";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is missing. Add it to your local .env file."
    );
  }

  return new Groq({ apiKey });
}

export async function readContractWithGroq({
  sourceCode,
  systemPrompt,
  client = createGroqClient(),
  model = process.env.GROQ_MODEL,
}) {
  if (!model) {
    throw new Error(
      "GROQ_MODEL is missing. Add it to your local .env file."
    );
  }

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Analyze this Solidity contract:\n\n${sourceCode}`,
      },
    ],
  });

  const response = completion.choices[0]?.message?.content;

  if (!response) {
    throw new Error("Groq returned an empty response.");
  }

  return response.trim();
}