import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

const required = [
  "--registry",
  "registry.json",
  "--state",
  "state.json",
  "--policy",
  "policy.json",
];

test("arguments: parses offline plan mode", () => {
  const result = parseArguments(["--plan", "plan.json", ...required]);
  assert.equal(result.planPath, "plan.json");
  assert.equal(result.requestPath, null);
});

test("arguments: parses Groq request mode", () => {
  const result = parseArguments(["--request", "goal.txt", ...required]);
  assert.equal(result.requestPath, "goal.txt");
});

test("arguments: requires exactly one planning mode", () => {
  assert.throws(() => parseArguments(required), /exactly one/);
  assert.throws(
    () => parseArguments(["--plan", "plan.json", "--request", "goal.txt", ...required]),
    /exactly one/
  );
});

test("arguments: requires registry, state, and policy", () => {
  assert.throws(() => parseArguments(["--plan", "plan.json"]), /--registry/);
});

test("arguments: parses a local export path", () => {
  const result = parseArguments([
    "--plan",
    "plan.json",
    ...required,
    "--export",
    "output/team.json",
  ]);
  assert.equal(result.exportPath, "output/team.json");
});

test("arguments: allows help and rejects unknown flags", () => {
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--execute"]), /Unknown argument/);
});
