import { config } from "dotenv";
import { parseArguments, HELP_TEXT } from "./arguments.js";
import { readJsonFile } from "./files.js";
import { validateNetworks, validateTransaction } from "./validate.js";
import { resolveNetworkSnapshots } from "./rpc.js";
import { buildFeeReport } from "./fees.js";
import { formatFeeReport } from "./report.js";
import { explainFeeReport } from "./groq.js";

config({ quiet: true });

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const { networks } = validateNetworks(await readJsonFile(options.networksPath));
  const transaction = validateTransaction(
    await readJsonFile(options.transactionPath)
  );
  const snapshots = await resolveNetworkSnapshots({ networks, live: options.live });
  const report = buildFeeReport({ snapshots, transaction });

  console.log(formatFeeReport(report));

  if (options.explain) {
    console.log("\n# Groq Explanation\n");
    console.log(await explainFeeReport({ report }));
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
