export function parseArguments(argv) {
  const options = { request: null, catalog: null, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--request" || argument === "--catalog") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      options[argument.slice(2)] = value;
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.help && (!options.request || !options.catalog)) {
    throw new Error("--request and --catalog are required.");
  }
  return options;
}
