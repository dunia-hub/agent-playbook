import test from "node:test";
import assert from "node:assert/strict";
import { formatSupportPreview } from "../src/format.js";

const base = {
  inbound: { messageId: "wamid.demo" },
  senderHash: "sha256:1234567890abcdef",
  privacy: { redactedText: "Nahitaji kiungo", detectedTypes: [] },
  analysis: {
    language: "sw",
    confidence: 0.98,
    intent: "meeting_link",
    urgency: "normal",
  },
  matches: [{ article: { id: "link-sw", title: "Kiungo" }, score: 4 }],
  escalation: { needsHuman: false, reasons: [] },
  reply: "Kiungo kinatumwa kwenye uthibitisho.",
};

test("preview: shows grounded response and no-send status", () => {
  const output = formatSupportPreview(base);
  assert.match(output, /Status: READY_TO_REVIEW/);
  assert.match(output, /link-sw: Kiungo/);
  assert.match(output, /Not sent/);
  assert.ok(!output.includes("254711111111"));
});

test("preview: blocks automated delivery for escalations", () => {
  const output = formatSupportPreview({
    ...base,
    escalation: { needsHuman: true, reasons: ["Human requested."] },
  });
  assert.match(output, /HUMAN_REVIEW_REQUIRED/);
  assert.match(output, /Automated approval is blocked/);
});

test("preview: reports duplicate delivery retries", () => {
  const output = formatSupportPreview({
    inbound: base.inbound,
    senderHash: base.senderHash,
    duplicate: true,
  });
  assert.match(output, /DUPLICATE_IGNORED/);
  assert.match(output, /No reply was prepared or sent/);
});
