import test from "node:test";
import assert from "node:assert/strict";

import {
  styleProgress,
  styleTerminalReport,
} from "../src/terminal-theme.js";

test("preserves plain report text when colours are disabled", () => {
  const report = "## Answer\nFinding [S1]";

  assert.equal(styleTerminalReport(report, false), report);
  assert.equal(styleProgress("Research complete", false), "→ Research complete");
});

test("adds Dunia Hub terminal colours when enabled", () => {
  const report =
    "## Key Findings\n- Finding [S1] — Confidence: high\n> Verify sources.";

  const styled = styleTerminalReport(report, true);

  assert.match(styled, /\u001b\[1;38;5;208m/);
  assert.match(styled, /\u001b\[38;5;214m/);
  assert.match(styled, /\u001b\[38;5;245m/);
});
