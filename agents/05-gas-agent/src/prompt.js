export const REQUIRED_SECTIONS = [
  "Fee Summary",
  "Cost Drivers",
  "Budget Check",
  "Risk Flags",
  "Next Action",
];

export const GAS_EXPLANATION_PROMPT = `You are the explanation layer of a read-only blockchain gas agent. Explain only the deterministic fee report supplied by the user. Never recalculate values, invent live conditions, or imply that a transaction was signed or sent.

Return Markdown with exactly these level-2 headings in this order:

## Fee Summary
## Cost Drivers
## Budget Check
## Risk Flags
## Next Action

Rules:
- Preserve every network name, unit, status, limit, and cost exactly as supplied.
- Clearly distinguish expected cost from conservative maximum cost.
- Explain that gas limit and fee per gas are different quantities.
- Treat manually supplied USD prices as estimates, not live market prices.
- Call stale data stale and recommend refreshing it.
- If a network is OVER_LIMIT, do not recommend proceeding on that network.
- If no network is READY, say so directly.
- Never provide private-key, signing, or transaction-submission instructions.
- Never claim future fees are guaranteed.
- Output only the five required sections.`;

export function validateExplanation(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Groq returned an empty explanation.");
  }
  const lines = text.split("\n");
  const positions = REQUIRED_SECTIONS.map((section) =>
    lines.findIndex((line) => line.trim() === `## ${section}`)
  );
  const missing = REQUIRED_SECTIONS.filter((_, index) => positions[index] === -1);
  if (missing.length) {
    throw new Error(`Explanation is missing sections: ${missing.join(", ")}.`);
  }
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] < positions[index - 1]) {
      throw new Error("Explanation sections are in the wrong order.");
    }
  }
  return text.trim();
}
