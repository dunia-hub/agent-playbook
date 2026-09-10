import { readFile } from "node:fs/promises";
import { parseArguments } from "./arguments.js";
import { validateCatalog } from "./catalog.js";
import { runToolAgent } from "./agent.js";
import { formatTrace } from "./format.js";

const HELP = `Tool Using Agent Example

Usage:
  npm start -- --request "YOUR QUESTION" --catalog PATH [--json]`;

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) return console.log(HELP);
  const catalog = validateCatalog(JSON.parse(await readFile(options.catalog, "utf8")));
  const trace = runToolAgent(options.request, catalog);
  console.log(options.json ? JSON.stringify(trace, null, 2) : formatTrace(trace));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
