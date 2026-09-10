import test from "node:test";
import assert from "node:assert/strict";
import { parseModelJson, validateAnalysis } from "../src/analysis.js";

const valid = {
  language: "sw",
  confidence: 0.98,
  intent: "meeting_link",
  searchTerms: ["kiungo", "warsha"],
  urgency: "normal",
};

test("analysis: parses plain and fenced JSON", () => {
  assert.deepEqual(parseModelJson(JSON.stringify(valid)), valid);
  assert.deepEqual(parseModelJson(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``), valid);
});

test("analysis: rejects invalid JSON", () => {
  assert.throws(() => parseModelJson("analysis: {}"), /not valid JSON/);
});

test("analysis: validates a complete analysis", () => {
  assert.deepEqual(validateAnalysis(valid), valid);
});

test("analysis: rejects missing and extra keys", () => {
  const { urgency, ...missing } = valid;
  assert.throws(() => validateAnalysis(missing), /missing: urgency/);
  assert.throws(() => validateAnalysis({ ...valid, reply: "hi" }), /unsupported keys/);
});

test("analysis: validates language and confidence", () => {
  assert.throws(() => validateAnalysis({ ...valid, language: "Swahili" }), /ISO/);
  assert.throws(() => validateAnalysis({ ...valid, confidence: 1.1 }), /0 to 1/);
});

test("analysis: limits search terms", () => {
  assert.throws(
    () => validateAnalysis({ ...valid, searchTerms: ["1", "2", "3", "4", "5", "6", "7"] }),
    /at most 6/
  );
});

test("analysis: validates urgency", () => {
  assert.throws(() => validateAnalysis({ ...valid, urgency: "emergency" }), /urgency/);
});
