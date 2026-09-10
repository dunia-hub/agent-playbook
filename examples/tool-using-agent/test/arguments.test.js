import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses the required files and JSON flag", () => {
  assert.deepEqual(parseArguments(["--request", "list", "--catalog", "events.json", "--json"]), {
    request: "list", catalog: "events.json", json: true, help: false,
  });
});

test("arguments: requires a request and catalog", () => {
  assert.throws(() => parseArguments(["--request", "list"]), /required/);
});

test("arguments: rejects unknown flags", () => {
  assert.throws(() => parseArguments(["--wat"]), /Unknown/);
});
