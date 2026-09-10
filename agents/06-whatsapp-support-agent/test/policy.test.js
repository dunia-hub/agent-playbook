import test from "node:test";
import assert from "node:assert/strict";
import { assessEscalation, validatePolicy } from "../src/policy.js";

const policy = {
  supportedLanguages: ["en", "sw"],
  fallbackLanguage: "en",
  minimumLanguageConfidence: 0.75,
  highRiskRules: [{ label: "lost funds", terms: ["stolen funds", "pesa zimepotea"] }],
  escalationReplies: { en: "Human review.", sw: "Mtu akague." },
};
const analysis = {
  language: "sw",
  confidence: 0.95,
  intent: "meeting_link",
  searchTerms: ["kiungo"],
  urgency: "normal",
};
const match = [{ article: { id: "link-sw" }, score: 2 }];

function assess(overrides = {}) {
  return assessEscalation({
    analysis,
    redactedText: "Nahitaji kiungo",
    detectedTypes: [],
    matches: match,
    policy,
    ...overrides,
  });
}

test("policy: validates a complete policy", () => {
  assert.equal(validatePolicy(policy), policy);
});

test("policy: requires an escalation reply for each language", () => {
  assert.throws(
    () => validatePolicy({ ...policy, escalationReplies: { en: "Human review." } }),
    /Missing escalation reply for sw/
  );
});

test("policy: allows a grounded, supported request", () => {
  assert.deepEqual(assess(), { needsHuman: false, reasons: [] });
});

test("policy: escalates unsupported or low-confidence language", () => {
  assert.equal(assess({ analysis: { ...analysis, language: "de" } }).needsHuman, true);
  assert.equal(assess({ analysis: { ...analysis, confidence: 0.5 } }).needsHuman, true);
});

test("policy: escalates critical urgency", () => {
  const result = assess({ analysis: { ...analysis, urgency: "critical" } });
  assert.match(result.reasons[0], /critical urgency/);
});

test("policy: escalates payment cards and secrets", () => {
  const result = assess({ detectedTypes: ["PAYMENT_CARD", "SECRET"] });
  assert.equal(result.needsHuman, true);
  assert.match(result.reasons[0], /Sensitive payment or secret/);
});

test("policy: matches multilingual high-risk terms", () => {
  const result = assess({ redactedText: "Pesa zimepotea kwenye akaunti" });
  assert.match(result.reasons[0], /lost funds/);
});

test("policy: escalates instead of guessing without knowledge", () => {
  const result = assess({ matches: [] });
  assert.match(result.reasons[0], /No grounded knowledge-base answer/);
});
