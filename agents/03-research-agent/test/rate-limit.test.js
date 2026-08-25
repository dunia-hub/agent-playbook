import test from "node:test";
import assert from "node:assert/strict";

import { getRateLimitDelayMs } from "../src/rate-limit.js";

test("parses millisecond rate-limit guidance with a safety buffer", () => {
  assert.equal(
    getRateLimitDelayMs(
      new Error("Rate limit reached. Please try again in 360ms."),
    ),
    1110,
  );
});

test("parses second-based rate-limit guidance", () => {
  assert.equal(
    getRateLimitDelayMs(
      new Error("rate_limit_exceeded: try again in 2.5s"),
    ),
    3250,
  );
});

test("does not delay unrelated errors", () => {
  assert.equal(getRateLimitDelayMs(new Error("Invalid JSON")), null);
});
