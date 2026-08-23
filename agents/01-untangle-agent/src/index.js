// The runnable agent. Reads a brain-dump from stdin (ending with DONE),
// sends it to Groq, validates the structure, and prints the result.
import { readMultilineInput } from './input.js';
import { untangle, GROQ_MODEL } from './groq.js';
import { validateResponse } from './validate.js';
import { writeFile } from 'node:fs/promises';

function parseArgs() {
  const args = process.argv.slice(2);
  let jsonMode = false;
  let outPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') {
      jsonMode = true;
    } else if (args[i] === '--out') {
      outPath = args[i + 1];
      if (!outPath) {
        console.error('Error: --out requires a file path argument.');
        process.exit(1);
      }
      i++; // skip the next arg since it's the out path
    }
  }

  return { jsonMode, outPath };
}

function formatJsonOutput(data) {
  // Convert the JSON object to a readable Markdown-like string.
  const lines = [];
  for (const section of Object.keys(data)) {
    lines.push(`## ${section}`);
    for (const bullet of data[section]) {
      lines.push(`- ${bullet}`);
    }
  }
  return lines.join('\n');
}

async function main() {
  const { jsonMode, outPath } = parseArgs();

  console.error('Untangle Agent');
  console.error(`Model: ${GROQ_MODEL}`);
  if (jsonMode) {
    console.error('Mode: JSON (structured output)');
  }
  console.error('Paste your messy notes below. Type DONE on its own line to finish.\n');

  const rawText = await readMultilineInput();

  if (rawText.trim() === '') {
    console.error('No input received. Nothing to untangle.');
    process.exit(1);
  }

  console.error('\nUntangling...\n');

  let response;
  try {
    response = await untangle(rawText, jsonMode);
  } catch (err) {
    console.error('Groq request failed:', err.message);
    process.exit(1);
  }

  // Convert JSON object to string for validation and output.
  let outputText;
  if (jsonMode && typeof response === 'object') {
    outputText = formatJsonOutput(response);
  } else {
    outputText = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
  }

  const result = validateResponse(outputText);
  if (!result.valid) {
    console.error('Warning: response did not match the expected structure:');
    for (const e of result.errors) console.error('  - ' + e);
    console.error('\nRaw response below:\n');
  }

  if (outPath) {
    try {
      const contentToWrite = jsonMode && typeof response === 'object'
        ? JSON.stringify(response, null, 2)
        : outputText;
      await writeFile(outPath, contentToWrite, 'utf-8');
      console.error(`Output saved to: ${outPath}`);
    } catch (err) {
      console.error(`Failed to write output file: ${err.message}`);
      process.exit(1);
    }
  }

  // The structured result goes to stdout so it can be piped or redirected.
  if (jsonMode && typeof response === 'object') {
    console.log(JSON.stringify(response, null, 2));
  } else {
    console.log(outputText);
  }
}

main();
