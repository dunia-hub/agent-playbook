export function formatTrace(trace) {
  return [
    "# Tool Using Agent Result",
    "",
    `Decision: ${trace.decision}`,
    `Tool: ${trace.toolCall.name}`,
    `Arguments: ${JSON.stringify(trace.toolCall.arguments)}`,
    "",
    "## Answer",
    "",
    trace.answer,
  ].join("\n");
}
