import test from "node:test";
import assert from "node:assert/strict";
import { formatFeeReport } from "../src/report.js";

const report = {
  transaction: {
    name: "Token transfer",
    gasLimit: "65000",
    budgetUsd: 0.05,
    maxFeeGwei: 40,
  },
  bestFit: "Base Sepolia",
  estimates: [
    {
      network: "Base Sepolia",
      chainId: 84532,
      source: "snapshot",
      feeModel: "eip1559",
      expectedFeeGwei: "0.013",
      maximumFeeGwei: "0.025",
      expectedCostNative: "0.000001",
      maximumCostNative: "0.000002",
      currencySymbol: "ETH",
      expectedCostUsd: 0.0024,
      maximumCostUsd: 0.0048,
      ageSeconds: 60,
      futureDated: false,
      status: "READY",
      stale: false,
      blockers: [],
    },
  ],
};

test("report: prints deterministic estimates and safety language", () => {
  const output = formatFeeReport(report);
  assert.match(output, /# Gas Agent Report/);
  assert.match(output, /Expected fee: 0.013 gwei/);
  assert.match(output, /Conservative maximum cost/);
  assert.match(output, /has not signed or sent a transaction/);
});

test("report: prints blockers and stale-data warnings", () => {
  const output = formatFeeReport({
    ...report,
    bestFit: null,
    estimates: [
      {
        ...report.estimates[0],
        status: "OVER_LIMIT",
        stale: true,
        expectedCostUsd: null,
        maximumCostUsd: null,
        blockers: ["Maximum fee exceeds the limit."],
      },
    ],
  });
  assert.match(output, /Maximum fee exceeds the limit/);
  assert.match(output, /fee data is older/);
  assert.match(output, /USD cost is unavailable/);
  assert.match(output, /No network is currently marked READY/);
});

test("report: states when no risk flags were detected", () => {
  assert.match(formatFeeReport(report), /## Risk Flags\n\n- None detected/);
});

test("report: identifies a future-dated snapshot", () => {
  const output = formatFeeReport({
    ...report,
    bestFit: null,
    estimates: [
      {
        ...report.estimates[0],
        status: "REVIEW_STALE_DATA",
        stale: true,
        futureDated: true,
      },
    ],
  });
  assert.match(output, /snapshot timestamp is later than the report time/);
});
