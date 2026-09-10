const HIGH_PRIORITY = /\b(urgent|immediately|asap|emergency|blocked)\b/i;
const MEDIUM_PRIORITY = /\b(today|tomorrow|soon|deadline)\b/i;
const REQUEST = /\b(please|need|want|review|create|prepare|send|fix|help)\b/i;

export function validateInput(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Input must be a non-empty string.");
  }
  if (value.trim().length > 1000) {
    throw new Error("Input must not exceed 1000 characters.");
  }
  return value.trim().replace(/\s+/g, " ");
}

function firstAction(text) {
  const sentence = text.split(/[.!?]/, 1)[0].trim();
  return sentence.length <= 140 ? sentence : `${sentence.slice(0, 137)}...`;
}

export function runBasicAgent(value) {
  const input = validateInput(value);
  const intent = input.includes("?") ? "question" : REQUEST.test(input) ? "request" : "note";
  const priority = HIGH_PRIORITY.test(input)
    ? "high"
    : MEDIUM_PRIORITY.test(input)
      ? "medium"
      : "normal";

  return {
    intent,
    priority,
    nextAction: intent === "note" ? "Clarify the desired outcome." : firstAction(input),
    assumptions: [],
  };
}
