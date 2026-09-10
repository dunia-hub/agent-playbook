import test from "node:test";
import assert from "node:assert/strict";
import { formatReview } from "../src/report.js";

test("report: prints checks and the review boundary", () => {
  const output = formatReview({
    agent: "sample-agent",
    status: "READY_FOR_HUMAN_REVIEW",
    score: { passed: 1, total: 1 },
    checks: [{ passed: true, label: "Folder", detail: "Ready." }],
    blockers: [],
  });
  assert.match(output, /PASS: Folder/);
  assert.match(output, /No submitted code was executed/);
  assert.match(output, /Human maintainer review is still required/);
});

test("report: prints blockers", () => {
  const output = formatReview({
    agent: "bad-agent",
    status: "NEEDS_WORK",
    score: { passed: 0, total: 1 },
    checks: [{ passed: false, label: "README", detail: "Missing." }],
    blockers: ["README: Missing."],
  });
  assert.match(output, /FAIL: README/);
  assert.match(output, /- README: Missing\./);
});
