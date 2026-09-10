// CUSTOMIZE: replace these instructions and the schema for your agent.
export const SYSTEM_PROMPT = `You are a starter planning agent.

Return only valid JSON with exactly these keys in this order:
{
  "summary": "string",
  "actions": ["string"],
  "assumptions": ["string"],
  "safetyNotes": ["string"]
}

Rules:
- Base the result only on the user's request.
- Use one to ten concise actions.
- State assumptions instead of presenting guesses as facts.
- Include at least one relevant safety note.
- Do not claim to have performed an external action.
- Do not request secrets, private keys, seed phrases, or passwords.
- Do not include Markdown or keys outside the schema.`;

export function buildMessages(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Input must be a non-empty string.");
  }
  if (input.trim().length > 4000) throw new Error("Input must not exceed 4000 characters.");
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: input.trim() },
  ];
}
