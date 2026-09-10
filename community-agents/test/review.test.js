import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { inspectAgent } from "../src/inspect.js";
import { reviewAgent } from "../src/review.js";

const sample = fileURLToPath(new URL("../examples/sample-agent", import.meta.url));

test("review: marks the valid fixture ready for human review", async () => {
  const review = await reviewAgent(await inspectAgent(sample));
  assert.equal(review.status, "READY_FOR_HUMAN_REVIEW");
  assert.deepEqual(review.score, { passed: 11, total: 11 });
  assert.deepEqual(review.blockers, []);
});

test("review: never approves or executes submitted code", async () => {
  const review = await reviewAgent(await inspectAgent(sample));
  assert.equal(review.automatedApproval, false);
  assert.equal(review.codeExecuted, false);
});
