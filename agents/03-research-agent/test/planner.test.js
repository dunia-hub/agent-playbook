import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlannerPrompt,
  validateResearchQuestion,
} from "../src/planner.js";

test("trims and returns a valid research question", () => {
  assert.equal(
    validateResearchQuestion("  How do research agents verify claims?  "),
    "How do research agents verify claims?",
  );
});

test("rejects a non-string research question", () => {
  assert.throws(
    () => validateResearchQuestion(null),
    /Research question must be a string/,
  );
});

test("rejects a question that is too short", () => {
  assert.throws(
    () => validateResearchQuestion("AI?"),
    /Research question is too short/,
  );
});

test("rejects a question longer than 1000 characters", () => {
  assert.throws(
    () => validateResearchQuestion("a".repeat(1001)),
    /must not exceed 1000 characters/,
  );
});

test("builds a dated planning prompt without answering the question", () => {
  const prompt = buildPlannerPrompt(
    "How do research agents verify claims?",
    "2026-08-24",
  );

  assert.match(prompt, /Current date: 2026-08-24/);
  assert.match(
    prompt,
    /Research question: How do research agents verify claims\?/,
  );
  assert.match(prompt, /between 2 and 3 non-overlapping research tasks/);
  assert.match(prompt, /Every task must be necessary/);
  assert.match(prompt, /Do not answer the research\s+question/);
  assert.match(prompt, /Return valid JSON only/);
});
