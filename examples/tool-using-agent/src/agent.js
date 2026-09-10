import { callTool } from "./tools.js";

export function decideTool(request) {
  if (typeof request !== "string" || request.trim() === "") {
    throw new Error("Request must be a non-empty string.");
  }
  if (/\b(list|show|all)\b/i.test(request)) {
    return { name: "list_workshops", arguments: {} };
  }
  return { name: "find_workshop", arguments: { query: request.trim() } };
}

export function runToolAgent(request, catalog) {
  const toolCall = decideTool(request);
  const toolResult = callTool(toolCall.name, toolCall.arguments, catalog);
  let answer;

  if (toolCall.name === "list_workshops") {
    answer = toolResult.workshops
      .map((item) => `${item.title} is on ${item.date} (${item.format}).`)
      .join(" ");
  } else if (toolResult.workshop) {
    const item = toolResult.workshop;
    answer = `${item.title} is on ${item.date} (${item.format}).`;
  } else {
    answer = "I could not find a matching workshop in the local catalog.";
  }

  return {
    decision: `Use ${toolCall.name} so the answer is grounded in the catalog.`,
    toolCall,
    toolResult,
    answer,
  };
}
