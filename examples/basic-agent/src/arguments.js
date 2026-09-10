export function parseArguments(argv) {
  const options = { input: null, file: null, json: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--input" || argument === "--file") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.help && Number(Boolean(options.input)) + Number(Boolean(options.file)) !== 1) {
    throw new Error("Provide exactly one of --input or --file.");
  }
  return options;
}
