import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: accepts inline input and JSON output", () => {
  assert.deepEqual(parseArguments(["--input", "hello", "--json"]), {
    input: "hello", file: null, json: true, help: false,
  });
});

test("arguments: accepts a file", () => {
  assert.equal(parseArguments(["--file", "request.txt"]).file, "request.txt");
});

test("arguments: requires exactly one input mode", () => {
  assert.throws(() => parseArguments([]), /exactly one/);
  assert.throws(() => parseArguments(["--input", "a", "--file", "b"]), /exactly one/);
});

test("arguments: allows help without input", () => {
  assert.equal(parseArguments(["--help"]).help, true);
});
