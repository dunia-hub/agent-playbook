import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

const required = [
  "--webhook",
  "webhook.json",
  "--knowledge",
  "knowledge.json",
  "--policy",
  "policy.json",
];

test("arguments: parses the required files", () => {
  const result = parseArguments(required);
  assert.equal(result.webhookPath, "webhook.json");
  assert.equal(result.knowledgePath, "knowledge.json");
  assert.equal(result.policyPath, "policy.json");
  assert.equal(result.approve, false);
});

test("arguments: parses offline analysis and processed IDs", () => {
  const result = parseArguments([
    ...required,
    "--analysis",
    "analysis.json",
    "--processed",
    "processed.json",
  ]);
  assert.equal(result.analysisPath, "analysis.json");
  assert.equal(result.processedPath, "processed.json");
});

test("arguments: parses approval and output", () => {
  const result = parseArguments([...required, "--approve", "--output", "reply.json"]);
  assert.equal(result.approve, true);
  assert.equal(result.outputPath, "reply.json");
});

test("arguments: requires every core input", () => {
  assert.throws(() => parseArguments(required.slice(2)), /--webhook/);
  assert.throws(() => parseArguments(required.slice(0, 2)), /--knowledge/);
});

test("arguments: rejects unknown flags and missing values", () => {
  assert.throws(() => parseArguments(["--send"]), /Unknown argument/);
  assert.throws(() => parseArguments(["--webhook"]), /requires a value/);
});

test("arguments: allows help without inputs", () => {
  assert.equal(parseArguments(["--help"]).help, true);
});
