export function parseArguments(args) {
  const options = {
    networksPath: null,
    transactionPath: null,
    live: false,
    explain: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--live") {
      options.live = true;
      continue;
    }
    if (argument === "--explain") {
      options.explain = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    const key = {
      "--networks": "networksPath",
      "--transaction": "transactionPath",
    }[argument];
    if (!key) throw new Error(`Unknown argument: ${argument}`);

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value.`);
    }
    options[key] = value;
    index += 1;
  }

  if (!options.help) {
    if (!options.networksPath) throw new Error("--networks is required.");
    if (!options.transactionPath) throw new Error("--transaction is required.");
  }

  return options;
}

export const HELP_TEXT = `Gas Agent

Compare saved fee snapshots entirely offline:
  npm start -- --networks examples/networks.snapshot.json --transaction examples/transaction.json

Read configured RPC endpoints without sending a transaction:
  npm start -- --networks examples/networks.rpc.json --transaction examples/transaction.json --live

Add a Groq explanation of the deterministic report:
  npm start -- --networks examples/networks.snapshot.json --transaction examples/transaction.json --explain`;
