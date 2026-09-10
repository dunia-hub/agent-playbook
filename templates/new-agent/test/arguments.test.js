import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses offline file mode", () => {
  assert.deepEqual(parseArguments(["--file", "request.txt", "--response", "response.json"]), {
    input: null, file: "request.txt", response: "response.json", json: false, help: false,
  });
});

test("arguments: parses online inline mode", () => {
  assert.equal(parseArguments(["--input", "help", "--json"]).json, true);
});

test("arguments: requires exactly one input mode", () => {
  assert.throws(() => parseArguments([]), /exactly one/);
  assert.throws(() => parseArguments(["--input", "a", "--file", "b"]), /exactly one/);
});

test("arguments: rejects missing values and unknown flags", () => {
  assert.throws(() => parseArguments(["--file"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown argument/);
});

test("arguments: allows help without inputs", () => {
  assert.equal(parseArguments(["--help"]).help, true);
});
