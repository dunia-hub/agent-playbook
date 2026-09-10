import test from "node:test";
import assert from "node:assert/strict";
import { hashSender, redactSensitiveText } from "../src/privacy.js";

test("privacy: redacts emails and phone numbers", () => {
  const result = redactSensitiveText("Email me@example.com or call +254 711 111 111");
  assert.equal(result.redactedText, "Email [EMAIL] or call [PHONE]");
  assert.deepEqual(result.detectedTypes, ["EMAIL", "PHONE"]);
});

test("privacy: redacts payment-card-like sequences", () => {
  const result = redactSensitiveText("Card 4111 1111 1111 1111 was charged");
  assert.match(result.redactedText, /\[PAYMENT_CARD\]/);
  assert.deepEqual(result.detectedTypes, ["PAYMENT_CARD"]);
});

test("privacy: redacts secret labels and nearby values", () => {
  const result = redactSensitiveText("private key: abc123 do not share");
  assert.match(result.redactedText, /\[SECRET\]/);
  assert.ok(!result.redactedText.includes("abc123"));
});

test("privacy: leaves ordinary support text unchanged", () => {
  const result = redactSensitiveText("When does the workshop begin?");
  assert.equal(result.redactedText, "When does the workshop begin?");
  assert.deepEqual(result.detectedTypes, []);
});

test("privacy: hashes senders deterministically without exposing them", () => {
  const first = hashSender("254711111111");
  assert.equal(first, hashSender("254711111111"));
  assert.match(first, /^sha256:[a-f0-9]{16}$/);
  assert.ok(!first.includes("254711111111"));
});
