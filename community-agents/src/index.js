import { resolve } from "node:path";
import { parseArguments } from "./arguments.js";
import { inspectAgent } from "./inspect.js";
import { reviewAgent } from "./review.js";
import { formatReview } from "./report.js";

const HELP = `Community Agent Validator

Usage:
  npm run validate -- PATH_TO_AGENT [--json]

The validator reads files but does not install dependencies or run agent code.`;

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) return console.log(HELP);
  const review = await reviewAgent(await inspectAgent(resolve(options.directory)));
  console.log(options.json ? JSON.stringify(review, null, 2) : formatReview(review));
  if (review.status !== "READY_FOR_HUMAN_REVIEW") process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
