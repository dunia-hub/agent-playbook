import test from "node:test";
import assert from "node:assert/strict";
import { composeReply } from "../src/reply.js";

const policy = {
  fallbackLanguage: "en",
  escalationReplies: { en: "Human review.", sw: "Mtu akague." },
};

test("reply: uses the top grounded knowledge answer", () => {
  const reply = composeReply({
    analysis: { language: "sw" },
    matches: [{ article: { answer: "Jibu sahihi." }, score: 5 }],
    escalation: { needsHuman: false },
    policy,
  });
  assert.equal(reply, "Jibu sahihi.");
});

test("reply: uses a localized escalation response", () => {
  const reply = composeReply({
    analysis: { language: "sw" },
    matches: [],
    escalation: { needsHuman: true },
    policy,
  });
  assert.equal(reply, "Mtu akague.");
});

test("reply: falls back safely for an unsupported language", () => {
  const reply = composeReply({
    analysis: { language: "de" },
    matches: [],
    escalation: { needsHuman: true },
    policy,
  });
  assert.equal(reply, "Human review.");
});
