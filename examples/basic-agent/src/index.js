import { readFile } from "node:fs/promises";
import { parseArguments } from "./arguments.js";
import { runBasicAgent } from "./agent.js";
import { formatResult } from "./format.js";

const HELP = `Basic Agent Example

Usage:
  npm start -- --input "YOUR TEXT" [--json]
  npm start -- --file PATH [--json]`;

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    console.log(HELP);
    return;
  }
  const input = options.file ? await readFile(options.file, "utf8") : options.input;
  const result = runBasicAgent(input);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatResult(result));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
