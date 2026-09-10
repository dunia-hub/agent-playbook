import test from "node:test";
import assert from "node:assert/strict";
import { buildFeeReport, estimateNetworkFee } from "../src/fees.js";

const transaction = {
  name: "Token transfer",
  gasLimit: "65000",
  baseFeeMultiplier: 2,
  budgetUsd: 0.01,
  maxFeeGwei: 40,
};
const snapshot = {
  name: "Base Sepolia",
  chainId: 84532,
  currencySymbol: "ETH",
  source: "snapshot",
  feeModel: "eip1559",
  observedAt: "2026-09-10T06:00:00Z",
  staleAfterSeconds: 300,
  baseFeePerGasWei: "12000000",
  priorityFeePerGasWei: "1000000",
  l1DataFeeWei: "200000000000",
  nativeTokenPriceUsd: 2400,
};
const now = new Date("2026-09-10T06:02:00Z");

test("fees: calculates EIP-1559 expected and maximum fees", () => {
  const estimate = estimateNetworkFee({ snapshot, transaction, now });
  assert.equal(estimate.expectedFeeGwei, "0.013");
  assert.equal(estimate.maximumFeeGwei, "0.025");
  assert.equal(estimate.expectedCostWei, "1045000000000");
  assert.equal(estimate.maximumCostWei, "1825000000000");
  assert.equal(estimate.status, "READY");
});

test("fees: includes optional L1 data fees", () => {
  const estimate = estimateNetworkFee({ snapshot, transaction, now });
  assert.equal(estimate.l1DataFeeWei, "200000000000");
  assert.equal(estimate.expectedCostNative, "0.000001045");
});

test("fees: calculates legacy gas prices", () => {
  const estimate = estimateNetworkFee({
    snapshot: {
      ...snapshot,
      name: "Legacy",
      feeModel: "legacy",
      gasPriceWei: "30000000000",
      l1DataFeeWei: "0",
    },
    transaction,
    now,
  });
  assert.equal(estimate.expectedFeeGwei, "30");
  assert.equal(estimate.maximumFeeGwei, "30");
});

test("fees: blocks a network over the gwei limit", () => {
  const estimate = estimateNetworkFee({
    snapshot: { ...snapshot, baseFeePerGasWei: "25000000000" },
    transaction,
    now,
  });
  assert.equal(estimate.status, "OVER_LIMIT");
  assert.match(estimate.blockers[0], /exceeds the 40 gwei limit/);
});

test("fees: blocks a network over the USD budget", () => {
  const estimate = estimateNetworkFee({
    snapshot,
    transaction: { ...transaction, budgetUsd: 0.001 },
    now,
  });
  assert.equal(estimate.status, "OVER_LIMIT");
  assert.match(estimate.blockers[0], /exceeds the \$0.00 budget/);
});

test("fees: flags stale data when no policy limit is exceeded", () => {
  const estimate = estimateNetworkFee({
    snapshot,
    transaction,
    now: new Date("2026-09-10T07:00:00Z"),
  });
  assert.equal(estimate.stale, true);
  assert.equal(estimate.status, "REVIEW_STALE_DATA");
});

test("fees: does not treat a future-dated snapshot as fresh", () => {
  const estimate = estimateNetworkFee({
    snapshot: { ...snapshot, observedAt: "2026-09-10T08:00:00Z" },
    transaction,
    now,
  });
  assert.equal(estimate.futureDated, true);
  assert.equal(estimate.stale, true);
  assert.equal(estimate.status, "REVIEW_STALE_DATA");
});

test("report: compares ready networks using USD, not raw token units", () => {
  const expensive = { ...snapshot, name: "Expensive", nativeTokenPriceUsd: 5000 };
  const cheaper = { ...snapshot, name: "Cheaper", nativeTokenPriceUsd: 1 };
  const report = buildFeeReport({ snapshots: [expensive, cheaper], transaction, now });
  assert.equal(report.bestFit, "Cheaper");
  assert.equal(report.readyCount, 2);
});

test("report: does not rank different tokens without USD prices", () => {
  const report = buildFeeReport({
    snapshots: [{ ...snapshot, nativeTokenPriceUsd: null }],
    transaction,
    now,
  });
  assert.equal(report.bestFit, null);
  assert.equal(report.readyCount, 0);
});
