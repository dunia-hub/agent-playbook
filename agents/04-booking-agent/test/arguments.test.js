import test from "node:test";
import assert from "node:assert/strict";
import { parseArguments } from "../src/arguments.js";

test("arguments: parses offline preview options", () => {
  assert.deepEqual(
    parseArguments(["--intent", "intent.json", "--calendar", "calendar.json"]),
    {
      requestPath: null,
      intentPath: "intent.json",
      calendarPath: "calendar.json",
      confirm: null,
      outputPath: "output/booking.ics",
      help: false,
    }
  );
});

test("arguments: parses confirmation and output", () => {
  const options = parseArguments([
    "--request",
    "request.txt",
    "--calendar",
    "calendar.json",
    "--confirm",
    "2",
    "--output",
    "invite.ics",
  ]);
  assert.equal(options.confirm, 2);
  assert.equal(options.outputPath, "invite.ics");
});

test("arguments: requires exactly one input mode", () => {
  assert.throws(
    () => parseArguments(["--calendar", "calendar.json"]),
    /exactly one/
  );
  assert.throws(
    () =>
      parseArguments([
        "--request",
        "request.txt",
        "--intent",
        "intent.json",
        "--calendar",
        "calendar.json",
      ]),
    /exactly one/
  );
});

test("arguments: requires a calendar", () => {
  assert.throws(() => parseArguments(["--intent", "intent.json"]), /calendar/);
});

test("arguments: rejects invalid slot selections", () => {
  assert.throws(
    () =>
      parseArguments([
        "--intent",
        "intent.json",
        "--calendar",
        "calendar.json",
        "--confirm",
        "zero",
      ]),
    /positive slot number/
  );
});

test("arguments: allows help without other flags", () => {
  assert.equal(parseArguments(["--help"]).help, true);
});
