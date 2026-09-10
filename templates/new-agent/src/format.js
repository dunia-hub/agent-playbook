export function formatResult(result, mode) {
  const list = (items) => items.length ? items.map((item) => `- ${item}`) : ["- None"];
  return [
    "# Starter Agent Result",
    "",
    `Mode: ${mode}`,
    "",
    "## Summary",
    "",
    result.summary,
    "",
    "## Actions",
    "",
    ...list(result.actions),
    "",
    "## Assumptions",
    "",
    ...list(result.assumptions),
    "",
    "## Safety Notes",
    "",
    ...list(result.safetyNotes),
  ].join("\n");
}
