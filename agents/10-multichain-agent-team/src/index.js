import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArguments, HELP_TEXT } from "./arguments.js";
import { readJsonFile, readTextFile } from "./files.js";
import {
  validatePlan,
  validatePolicy,
  validateRegistry,
  validateState,
} from "./validate.js";
import { planWithGroq } from "./groq.js";
import { runAgentTeam } from "./coordinator.js";
import { formatTeamReport } from "./report.js";

config({ quiet: true });

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const registry = validateRegistry(await readJsonFile(options.registryPath));
  const state = validateState(await readJsonFile(options.statePath), registry);
  const policy = validatePolicy(await readJsonFile(options.policyPath), registry);
  const rawPlan = options.planPath
    ? await readJsonFile(options.planPath)
    : await planWithGroq({
        request: await readTextFile(options.requestPath),
        registry,
        policy,
      });
  const plan = validatePlan(rawPlan, registry, policy);
  const result = await runAgentTeam({ plan, registry, state, policy });

  console.log(formatTeamReport(result));

  if (options.exportPath) {
    await mkdir(dirname(options.exportPath), { recursive: true });
    await writeFile(options.exportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`Plan-only handoff exported: ${options.exportPath}`);
    console.log("The handoff contains no signatures or transactions.");
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
