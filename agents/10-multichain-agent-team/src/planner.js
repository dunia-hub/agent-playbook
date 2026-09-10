const PLAN_KEYS = ["goal", "executionMode", "operations", "notes"];

export function parsePlanJson(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("Groq returned an empty plan.");
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(unfenced);
    const extra = Object.keys(parsed).filter((key) => !PLAN_KEYS.includes(key));
    if (extra.length) throw new Error(`Groq plan has unsupported keys: ${extra.join(", ")}.`);
    return parsed;
  } catch (error) {
    if (error.message.startsWith("Groq plan has")) throw error;
    throw new Error("Groq plan is not valid JSON.");
  }
}
