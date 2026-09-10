import Groq from "groq-sdk";
import { BOOKING_INTENT_PROMPT } from "./prompt.js";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is missing or still the placeholder. Add it to .env, or use --intent for offline mode."
    );
  }
  return new Groq({ apiKey });
}

export async function extractBookingIntent({
  request,
  ownerTimeZone,
  now = new Date(),
  client = createGroqClient(),
  model = process.env.GROQ_MODEL || "openai/gpt-oss-20b",
}) {
  if (typeof request !== "string" || !request.trim()) {
    throw new Error("The booking request is empty.");
  }

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 2048,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [
      { role: "system", content: BOOKING_INTENT_PROMPT },
      {
        role: "user",
        content: [
          `Current timestamp: ${now.toISOString()}`,
          `Calendar owner time zone: ${ownerTimeZone}`,
          "Booking request:",
          request.trim(),
        ].join("\n"),
      },
    ],
  });

  const response = completion.choices[0]?.message?.content;
  if (!response?.trim()) {
    throw new Error("Groq returned an empty booking intent.");
  }

  return response.trim();
}
