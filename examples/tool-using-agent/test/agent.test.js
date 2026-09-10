import test from "node:test";
import assert from "node:assert/strict";
import { decideTool, runToolAgent } from "../src/agent.js";

const catalog = { workshops: [
  { id: "02-contract-reader", title: "Smart Contract Reader", date: "2026-09-15", format: "Online" },
] };

test("agent: selects the list tool", () => {
  assert.equal(decideTool("Show all workshops").name, "list_workshops");
});

test("agent: selects the lookup tool", () => {
  assert.equal(decideTool("When is contract reader?").name, "find_workshop");
});

test("agent: answers from a tool result", () => {
  const trace = runToolAgent("When is contract reader?", catalog);
  assert.equal(trace.toolResult.workshop.id, "02-contract-reader");
  assert.match(trace.answer, /2026-09-15/);
});

test("agent: gives a grounded no-match response", () => {
  assert.match(runToolAgent("When is cooking?", catalog).answer, /could not find/);
});

test("agent: rejects an empty request", () => {
  assert.throws(() => decideTool(" "), /non-empty/);
});
