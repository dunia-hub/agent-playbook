import test from "node:test";
import assert from "node:assert/strict";
import { parsePlanJson } from "../src/planner.js";

const plan = {
  goal: "Prepare a demo",
  executionMode: "plan_only",
  operations: [],
  notes: [],
};

test("planner: parses plain and fenced JSON", () => {
  assert.deepEqual(parsePlanJson(JSON.stringify(plan)), plan);
  assert.deepEqual(parsePlanJson(`\`\`\`json\n${JSON.stringify(plan)}\n\`\`\``), plan);
});

test("planner: rejects empty and malformed output", () => {
  assert.throws(() => parsePlanJson(""), /empty plan/);
  assert.throws(() => parsePlanJson("plan: {}"), /not valid JSON/);
});

test("planner: rejects unsupported top-level keys early", () => {
  assert.throws(
    () => parsePlanJson(JSON.stringify({ ...plan, execute: true })),
    /unsupported keys: execute/
  );
});
