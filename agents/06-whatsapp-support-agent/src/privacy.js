import { createHash } from "node:crypto";

const REDACTIONS = [
  {
    type: "PAYMENT_CARD",
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
  },
  {
    type: "EMAIL",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    type: "SECRET",
    pattern: /\b(?:seed phrase|private key|password|api key)\s*[:=]?\s*\S+(?:\s+\S+){0,3}/gi,
  },
  {
    type: "PHONE",
    pattern: /(?<!\w)(?:\+?\d[\d ()-]{7,}\d)(?!\w)/g,
  },
];

export function redactSensitiveText(text) {
  if (typeof text !== "string") throw new Error("Message text must be a string.");
  const detectedTypes = [];
  let redactedText = text;
  for (const { type, pattern } of REDACTIONS) {
    pattern.lastIndex = 0;
    if (pattern.test(redactedText)) detectedTypes.push(type);
    pattern.lastIndex = 0;
    redactedText = redactedText.replace(pattern, `[${type}]`);
  }
  return { redactedText, detectedTypes };
}

export function hashSender(sender) {
  if (typeof sender !== "string" || !sender) throw new Error("Sender is required.");
  return `sha256:${createHash("sha256").update(sender).digest("hex").slice(0, 16)}`;
}
