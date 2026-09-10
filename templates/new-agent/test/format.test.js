import test from "node:test";
import assert from "node:assert/strict";
import { formatResult } from "../src/format.js";

test("format: prints all required sections and the mode", () => {
  const output = formatResult({
    summary: "Ready", actions: ["Test"], assumptions: [], safetyNotes: ["Review"],
  }, "offline_fixture");
  assert.match(output, /Mode: offline_fixture/);
  assert.match(output, /## Actions/);
  assert.match(output, /## Assumptions\n\n- None/);
  assert.match(output, /## Safety Notes/);
});
