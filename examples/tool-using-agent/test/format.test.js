import test from "node:test";
import assert from "node:assert/strict";
import { formatTrace } from "../src/format.js";

test("format: exposes the selected tool and grounded answer", () => {
  const output = formatTrace({
    decision: "Use the catalog.",
    toolCall: { name: "find_workshop", arguments: { query: "reader" } },
    answer: "Smart Contract Reader is on 2026-09-15 (Online).",
  });
  assert.match(output, /Tool: find_workshop/);
  assert.match(output, /Smart Contract Reader/);
});
