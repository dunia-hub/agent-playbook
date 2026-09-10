const KEYS = ["summary", "actions", "assumptions", "safetyNotes"];

export function parseAgentResponse(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Agent response must not be empty.");
  }
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  const json = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Agent response must be valid JSON, optionally inside one JSON code fence.");
  }
}

function validateList(value, name, { minimum = 0, maximum = 10 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${name} must contain ${minimum} to ${maximum} items.`);
  }
  if (value.some((item) => typeof item !== "string" || item.trim() === "" || item.length > 300)) {
    throw new Error(`${name} items must be non-empty strings of at most 300 characters.`);
  }
  return value.map((item) => item.trim());
}

export function validateAgentResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Agent result must be a JSON object.");
  }
  const missing = KEYS.filter((key) => !(key in value));
  const extra = Object.keys(value).filter((key) => !KEYS.includes(key));
  if (missing.length) throw new Error(`Agent result is missing: ${missing.join(", ")}.`);
  if (extra.length) throw new Error(`Agent result has unsupported keys: ${extra.join(", ")}.`);
  if (typeof value.summary !== "string" || value.summary.trim() === "" || value.summary.length > 500) {
    throw new Error("summary must be a non-empty string of at most 500 characters.");
  }
  return {
    summary: value.summary.trim(),
    actions: validateList(value.actions, "actions", { minimum: 1 }),
    assumptions: validateList(value.assumptions, "assumptions"),
    safetyNotes: validateList(value.safetyNotes, "safetyNotes", { minimum: 1 }),
  };
}
