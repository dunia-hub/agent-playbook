import "dotenv/config";
import { parseArguments } from "./arguments.js";
import { readText } from "./files.js";
import { createGroqClient, runWithGroq } from "./groq.js";
import { formatResult } from "./format.js";
import { parseAgentResponse, validateAgentResult } from "./validate.js";

const HELP = `New Agent Template

Usage:
  npm start -- --input "YOUR REQUEST" [--response PATH] [--json]
  npm start -- --file PATH [--response PATH] [--json]

Use --response for free, reproducible offline mode. Without it, Groq is used.`;

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const options = parseArguments(argv);
  if (options.help) return console.log(HELP);
  const input = options.file ? await readText(options.file, "Input file") : options.input.trim();
  const mode = options.response ? "offline_fixture" : "groq";
  const result = options.response
    ? validateAgentResult(parseAgentResponse(await readText(options.response, "Response file")))
    : await runWithGroq({
      input,
      client: dependencies.client ?? createGroqClient(),
      model: process.env.GROQ_MODEL,
    });
  console.log(options.json ? JSON.stringify(result, null, 2) : formatResult(result, mode));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
