import test from "node:test";
import assert from "node:assert/strict";
import { reviewSubmission } from "../src/agent.js";

const ready = {
  name: "FAQ Agent", slug: "faq-agent", purpose: "Answer common questions from reviewed local documentation.",
  runCommand: "npm start", testCommand: "npm test", safety: ["Do not guess unsupported answers."], externalServices: [],
};

test("agent: marks a complete submission ready for human review", () => {
  const review = reviewSubmission(ready);
  assert.equal(review.status, "READY_FOR_HUMAN_REVIEW");
  assert.deepEqual(review.score, { passed: 7, total: 7 });
  assert.equal(review.automatedApproval, false);
});

test("agent: reports concrete recommendations", () => {
  const review = reviewSubmission({ ...ready, slug: "FAQ Agent", safety: [] });
  assert.equal(review.status, "NEEDS_WORK");
  assert.equal(review.recommendations.length, 2);
  assert.match(review.recommendations.join(" "), /lowercase/);
});

test("agent: accepts an honestly empty external-service list", () => {
  const serviceCheck = reviewSubmission(ready).checks.find((check) => check.id === "services");
  assert.equal(serviceCheck.passed, true);
});
