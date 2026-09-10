export function parseArguments(args) {
  const options = {
    webhookPath: null,
    knowledgePath: null,
    policyPath: null,
    analysisPath: null,
    processedPath: null,
    approve: false,
    outputPath: "output/whatsapp-reply.json",
    help: false,
  };
  const valueFlags = new Map([
    ["--webhook", "webhookPath"],
    ["--knowledge", "knowledgePath"],
    ["--policy", "policyPath"],
    ["--analysis", "analysisPath"],
    ["--processed", "processedPath"],
    ["--output", "outputPath"],
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--approve") {
      options.approve = true;
      continue;
    }
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
    for (const [key, flag] of [
      ["webhookPath", "--webhook"],
      ["knowledgePath", "--knowledge"],
      ["policyPath", "--policy"],
    ]) {
      if (!options[key]) throw new Error(`${flag} is required.`);
    }
  }
  return options;
}

export const HELP_TEXT = `Multilingual WhatsApp Support Agent

Run the complete workflow offline:
  npm start -- --webhook examples/webhook.sw.json --knowledge examples/knowledge-base.json --policy examples/policy.json --analysis examples/analysis.sw.json

Use Groq only for structured message analysis:
  npm start -- --webhook examples/webhook.sw.json --knowledge examples/knowledge-base.json --policy examples/policy.json

After reviewing a safe reply, prepare (but do not send) a WhatsApp payload:
  npm start -- --webhook examples/webhook.sw.json --knowledge examples/knowledge-base.json --policy examples/policy.json --analysis examples/analysis.sw.json --approve --output output/whatsapp-reply.json`;
