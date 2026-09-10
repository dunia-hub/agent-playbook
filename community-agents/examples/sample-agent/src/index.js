const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  console.error("Provide an input.");
  process.exitCode = 1;
} else console.log(JSON.stringify({ input, output: input }, null, 2));
