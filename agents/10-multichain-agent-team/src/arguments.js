export function parseArguments(args) {
  const options = {
    planPath: null,
    requestPath: null,
    registryPath: null,
    statePath: null,
    policyPath: null,
    exportPath: null,
    help: false,
  };
  const valueFlags = new Map([
    ["--plan", "planPath"],
    ["--request", "requestPath"],
    ["--registry", "registryPath"],
    ["--state", "statePath"],
    ["--policy", "policyPath"],
    ["--export", "exportPath"],
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const key = valueFlags.get(argument);
    if (!key) throw new Error(`Unknown argument: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value.`);
    }
    options[key] = value;
    index += 1;
  }

  if (!options.help) {
    if (Boolean(options.planPath) === Boolean(options.requestPath)) {
      throw new Error("Provide exactly one of --plan or --request.");
    }
    for (const [key, flag] of [
      ["registryPath", "--registry"],
      ["statePath", "--state"],
      ["policyPath", "--policy"],
    ]) {
      if (!options[key]) throw new Error(`${flag} is required.`);
    }
  }
  return options;
}

export const HELP_TEXT = `Multichain Agent Team

Run the complete team offline:
  npm start -- --plan examples/plan.json --registry examples/registry.json --state examples/state.json --policy examples/policy.json

Ask Groq to create a plan, then run the same deterministic specialists:
  npm start -- --request examples/goal.txt --registry examples/registry.json --state examples/state.json --policy examples/policy.json

Export a plan-only handoff manifest:
  npm start -- --plan examples/plan.json --registry examples/registry.json --state examples/state.json --policy examples/policy.json --export output/team-handoff.json`;
