import test from "node:test";
import assert from "node:assert/strict";
import { buildMessages } from "../src/prompt.js";

test("prompt: builds bounded system and user messages", () => {
  const messages = buildMessages("  Prepare a plan.  ");
  assert.equal(messages.length, 2);
  assert.equal(messages[1].content, "Prepare a plan.");
  assert.match(messages[0].content, /Do not claim to have performed/);
});

test("prompt: rejects empty and oversized input", () => {
  assert.throws(() => buildMessages(" "), /non-empty/);
  assert.throws(() => buildMessages("x".repeat(4001)), /4000/);
});
