export function formatResult(result) {
  return [
    "# Basic Agent Result",
    "",
    `Intent: ${result.intent}`,
    `Priority: ${result.priority}`,
    `Next action: ${result.nextAction}`,
    `Assumptions: ${result.assumptions.length ? result.assumptions.join(", ") : "None"}`,
  ].join("\n");
}
