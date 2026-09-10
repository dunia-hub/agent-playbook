import test from "node:test";
import assert from "node:assert/strict";
import { runBasicAgent, validateInput } from "../src/agent.js";

test("agent: returns a structured request", () => {
  assert.deepEqual(runBasicAgent("Please review the outline today."), {
    intent: "request",
    priority: "medium",
    nextAction: "Please review the outline today",
    assumptions: [],
  });
});

test("agent: detects questions and high priority", () => {
  const result = runBasicAgent("Can you fix this urgent blocker?");
  assert.equal(result.intent, "question");
  assert.equal(result.priority, "high");
});

test("agent: asks for clarity on a note", () => {
  assert.equal(runBasicAgent("Workshop outline version two").nextAction, "Clarify the desired outcome.");
});

test("agent: rejects empty and oversized input", () => {
  assert.throws(() => validateInput("  "), /non-empty/);
  assert.throws(() => validateInput("x".repeat(1001)), /1000/);
});
