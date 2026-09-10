export function parseArguments(argv) {
  const options = { submission: null, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--submission") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--submission requires a path.");
      options.submission = value;
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.help && !options.submission) throw new Error("--submission is required.");
  return options;
}
