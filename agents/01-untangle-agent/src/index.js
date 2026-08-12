// The runnable agent. Reads a brain-dump from stdin (ending with DONE),
// sends it to Groq, validates the structure, and prints the result.
import { readMultilineInput } from './input.js';
import { untangle, GROQ_MODEL } from './groq.js';
import { validateResponse } from './validate.js';

async function main() {
  console.error('Untangle Agent');
  console.error(`Model: ${GROQ_MODEL}`);
  console.error('Paste your messy notes below. Type DONE on its own line to finish.\n');

  const rawText = await readMultilineInput();

  if (rawText.trim() === '') {
    console.error('No input received. Nothing to untangle.');
    process.exit(1);
  }

  console.error('\nUntangling...\n');

  let response;
  try {
    response = await untangle(rawText);
  } catch (err) {
    console.error('Groq request failed:', err.message);
    process.exit(1);
  }

  const result = validateResponse(response);
  if (!result.valid) {
    console.error('Warning: response did not match the expected structure:');
    for (const e of result.errors) console.error('  - ' + e);
    console.error('\nRaw response below:\n');
  }

  // The structured result goes to stdout so it can be piped or redirected.
  console.log(response);
}

main();
