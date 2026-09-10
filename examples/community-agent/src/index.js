import { readFile } from "node:fs/promises";
import { parseArguments } from "./arguments.js";
import { validateSubmission } from "./validate.js";
import { reviewSubmission } from "./agent.js";
import { formatReview } from "./format.js";

const HELP = `Community Agent Example

Usage:
  npm start -- --submission PATH [--json]`;

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) return console.log(HELP);
  const submission = validateSubmission(JSON.parse(await readFile(options.submission, "utf8")));
  const review = reviewSubmission(submission);
  console.log(options.json ? JSON.stringify(review, null, 2) : formatReview(submission, review));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
