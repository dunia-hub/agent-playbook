import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { validateResponse } from '../src/validate.js';
import { readMultilineInput } from '../src/input.js';

// --- Validation tests (no API calls) ---

const goodResponse = `## Tasks
- lock a venue
## Grouped Ideas
- venue and capacity
## Priorities
- venue depends on headcount
## Missing Info
- how many people
## Next Steps
- make a signup form`;

test('validate: accepts all five sections in order', () => {
  const result = validateResponse(goodResponse);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validate: rejects a response missing sections', () => {
  const result = validateResponse('## Tasks\n- a\n## Priorities\n- b');
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Grouped Ideas')));
  assert.ok(result.errors.some((e) => e.includes('Missing Info')));
  assert.ok(result.errors.some((e) => e.includes('Next Steps')));
});

test('validate: rejects sections in the wrong order', () => {
  const wrongOrder = `## Grouped Ideas
- a
## Tasks
- b
## Priorities
- c
## Missing Info
- d
## Next Steps
- e`;
  const result = validateResponse(wrongOrder);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.toLowerCase().includes('order')));
});

test('validate: rejects empty input', () => {
  assert.equal(validateResponse('').valid, false);
  assert.equal(validateResponse('   ').valid, false);
});

// --- Input parsing tests (fake stream, no keyboard) ---

// Build a fake stdin from a string so tests need no real typing.
function streamFrom(text) {
  const s = new Readable({ read() {} });
  s.push(text);
  s.push(null);
  return s;
}

test('input: collects lines until DONE', async () => {
  const input = streamFrom('venue is unclear\nmaybe 30 people\nDONE\n');
  const result = await readMultilineInput({ input });
  assert.equal(result, 'venue is unclear\nmaybe 30 people');
});

test('input: ignores everything after DONE', async () => {
  const input = streamFrom('line one\nDONE\nthis is ignored\nand this\n');
  const result = await readMultilineInput({ input });
  assert.equal(result, 'line one');
});

test('input: supports a custom sentinel', async () => {
  const input = streamFrom('keep this\nSTOP\ndrop this\n');
  const result = await readMultilineInput({ input, sentinel: 'STOP' });
  assert.equal(result, 'keep this');
});

test('input: returns empty string when DONE is the first line', async () => {
  const input = streamFrom('DONE\n');
  const result = await readMultilineInput({ input });
  assert.equal(result, '');
});
