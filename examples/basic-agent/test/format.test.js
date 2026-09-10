import test from "node:test";
import assert from "node:assert/strict";
import { formatResult } from "../src/format.js";

test("format: prints every result field", () => {
  const output = formatResult({ intent: "request", priority: "normal", nextAction: "Review", assumptions: [] });
  assert.match(output, /# Basic Agent Result/);
  assert.match(output, /Intent: request/);
  assert.match(output, /Assumptions: None/);
});
