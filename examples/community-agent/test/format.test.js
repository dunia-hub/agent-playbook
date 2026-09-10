import test from "node:test";
import assert from "node:assert/strict";
import { formatReview } from "../src/format.js";

test("format: states that human review is required", () => {
  const output = formatReview({ name: "FAQ Agent" }, {
    status: "READY_FOR_HUMAN_REVIEW", score: { passed: 1, total: 1 },
    checks: [{ passed: true, label: "Purpose" }], recommendations: [],
  });
  assert.match(output, /PASS: Purpose/);
  assert.match(output, /Human review is still required/);
});
