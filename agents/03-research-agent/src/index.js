import "dotenv/config";
import Groq from "groq-sdk";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { runResearchAgent } from "./research-agent.js";
import { styleProgress, styleTerminalReport } from "./terminal-theme.js";

async function readQuestion() {
  const argumentQuestion = process.argv.slice(2).join(" ").trim();

  if (argumentQuestion) {
    return argumentQuestion;
  }

  const readline = createInterface({ input, output });

  try {
    return await readline.question("Research question: ");
  } finally {
    readline.close();
  }
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is missing. Add it to a local .env file.",
    );
  }

  if (!model) {
    throw new Error(
      "GROQ_MODEL is missing. Add it to a local .env file.",
    );
  }

  const question = await readQuestion();
  const client = new Groq({ apiKey });

  const result = await runResearchAgent({
    question,
    client,
    model,
    onProgress(message) {
      console.error(styleProgress(message));
    },
  });

  console.log(`\n${styleTerminalReport(result.report)}`);

  if (result.retrievalFailures.length > 0) {
    console.error(
      `\nNote: ${result.retrievalFailures.length} search or page retrieval attempt(s) failed. The report uses only successfully retrieved sources.`,
    );
  }
}

main().catch((error) => {
  console.error(`\nResearch failed: ${error.message}`);
  process.exitCode = 1;
});
