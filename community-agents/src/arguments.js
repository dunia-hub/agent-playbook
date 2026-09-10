export function parseArguments(argv) {
  const options = { directory: null, json: false, help: false };

  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json") options.json = true;
    else if (argument.startsWith("--")) throw new Error(`Unknown argument: ${argument}`);
    else if (options.directory) throw new Error("Provide exactly one agent directory.");
    else options.directory = argument;
  }

  if (!options.help && !options.directory) throw new Error("Provide one agent directory.");
  return options;
}
