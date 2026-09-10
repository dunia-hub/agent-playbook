import test from "node:test";
import assert from "node:assert/strict";
import { parseAgentResponse, validateAgentResult } from "../src/validate.js";

const result = {
  summary: "Prepare the contribution.",
  actions: ["Run tests."],
  assumptions: [],
  safetyNotes: ["Do not commit secrets."],
};

test("response: parses plain JSON", () => {
  assert.deepEqual(parseAgentResponse(JSON.stringify(result)), result);
});

test("response: parses one JSON code fence", () => {
  assert.deepEqual(parseAgentResponse(`\`\`\`json\n${JSON.stringify(result)}\n\`\`\``), result);
});

test("response: rejects empty, invalid, and prose-wrapped JSON", () => {
  assert.throws(() => parseAgentResponse(""), /must not be empty/);
  assert.throws(() => parseAgentResponse("not json"), /valid JSON/);
  assert.throws(() => parseAgentResponse(`Result: ${JSON.stringify(result)}`), /valid JSON/);
});

test("validation: normalizes a complete result", () => {
  assert.equal(validateAgentResult({ ...result, summary: "  Ready  " }).summary, "Ready");
});

test("validation: rejects missing and extra keys", () => {
  const { summary, ...missing } = result;
  assert.throws(() => validateAgentResult(missing), /missing: summary/);
  assert.throws(() => validateAgentResult({ ...result, confidence: 1 }), /unsupported keys/);
});

test("validation: requires at least one action and safety note", () => {
  assert.throws(() => validateAgentResult({ ...result, actions: [] }), /1 to 10/);
  assert.throws(() => validateAgentResult({ ...result, safetyNotes: [] }), /1 to 10/);
});

test("validation: constrains list size and item length", () => {
  assert.throws(() => validateAgentResult({ ...result, actions: Array(11).fill("Act") }), /1 to 10/);
  assert.throws(() => validateAgentResult({ ...result, actions: ["x".repeat(301)] }), /at most 300/);
});

test("validation: constrains the summary", () => {
  assert.throws(() => validateAgentResult({ ...result, summary: "" }), /summary/);
  assert.throws(() => validateAgentResult({ ...result, summary: "x".repeat(501) }), /500/);
});
