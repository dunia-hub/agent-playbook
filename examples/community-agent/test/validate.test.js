import test from "node:test";
import assert from "node:assert/strict";
import { validateSubmission } from "../src/validate.js";

const submission = {
  name: "FAQ Agent", slug: "faq-agent", purpose: "Answer common questions from reviewed local documentation.",
  runCommand: "npm start", testCommand: "npm test", safety: ["Do not guess unsupported answers."], externalServices: [],
};

test("validation: accepts a complete submission", () => {
  assert.equal(validateSubmission(submission).slug, "faq-agent");
});

test("validation: rejects missing and extra keys", () => {
  const { name, ...missing } = submission;
  assert.throws(() => validateSubmission(missing), /missing: name/);
  assert.throws(() => validateSubmission({ ...submission, secret: "no" }), /unsupported keys/);
});

test("validation: enforces field types", () => {
  assert.throws(() => validateSubmission({ ...submission, safety: "be safe" }), /array of strings/);
});
