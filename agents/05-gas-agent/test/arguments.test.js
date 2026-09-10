import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses offline snapshot mode", () => {
  assert.deepEqual(
    parseArguments(["--networks", "networks.json", "--transaction", "tx.json"]),
    {
      networksPath: "networks.json",
      transactionPath: "tx.json",
      live: false,
      explain: false,
      help: false,
    }
  );
});

test("arguments: parses live and explain flags", () => {
  const result = parseArguments([
    "--networks",
    "networks.json",
    "--transaction",
    "tx.json",
    "--live",
    "--explain",
  ]);
  assert.equal(result.live, true);
  assert.equal(result.explain, true);
});

test("arguments: requires a networks file", () => {
  assert.throws(() => parseArguments(["--transaction", "tx.json"]), /networks/);
});

test("arguments: requires a transaction file", () => {
  assert.throws(() => parseArguments(["--networks", "networks.json"]), /transaction/);
});

test("arguments: rejects unknown flags", () => {
  assert.throws(() => parseArguments(["--send"]), /Unknown argument/);
});

test("arguments: allows help without input files", () => {
  assert.equal(parseArguments(["--help"]).help, true);
});
