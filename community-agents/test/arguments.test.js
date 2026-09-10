import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses a directory", () => {
  assert.deepEqual(parseArguments(["./my-agent"]), {
    directory: "./my-agent", json: false, help: false,
  });
});

test("arguments: parses JSON output", () => {
  assert.equal(parseArguments(["./my-agent", "--json"]).json, true);
});

test("arguments: requires exactly one directory", () => {
  assert.throws(() => parseArguments([]), /one agent directory/);
  assert.throws(() => parseArguments(["one", "two"]), /exactly one/);
});

test("arguments: allows help and rejects unknown flags", () => {
  assert.equal(parseArguments(["--help"]).help, true);
  assert.throws(() => parseArguments(["--execute"]), /Unknown argument/);
});
