import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses a submission path", () => {
  assert.equal(parseArguments(["--submission", "agent.json"]).submission, "agent.json");
});

test("arguments: parses JSON output", () => {
  assert.equal(parseArguments(["--submission", "agent.json", "--json"]).json, true);
});

test("arguments: requires a submission unless help is used", () => {
  assert.throws(() => parseArguments([]), /required/);
  assert.equal(parseArguments(["--help"]).help, true);
});
