import test from "node:test";
import assert from "node:assert/strict";
import { formatTeamReport } from "../src/report.js";

const result = {
  status: "TEAM_READY",
  executionMode: "plan_only",
  goal: "Prepare demos",
  executionOrder: ["base-demo"],
  preflight: { passed: true },
  notes: [],
  blockers: [],
  findings: [
    {
      operationId: "base-demo",
      specialist: "EVM Specialist",
      network: "Base Sepolia",
      family: "evm",
      action: "prepare_native_transfer",
      amount: "0.01",
      asset: "ETH",
      destination: "0x1111111111111111111111111111111111111111",
      estimatedFee: "0.001",
      remainingBalance: "0.9",
      snapshotAgeSeconds: 10,
      status: "READY",
      readOnlyCalls: ["eth_getBalance"],
      checks: ["Address valid."],
      blockers: [],
    },
  ],
};

test("report: shows coordinator and specialist results", () => {
  const output = formatTeamReport(result);
  assert.match(output, /Status: TEAM_READY/);
  assert.match(output, /Specialists consulted: 1/);
  assert.match(output, /base-demo: EVM Specialist/);
  assert.match(output, /eth_getBalance/);
});

test("report: displays consensus blockers", () => {
  const output = formatTeamReport({
    ...result,
    status: "TEAM_BLOCKED",
    blockers: ["base-demo: Address invalid."],
    findings: [
      {
        ...result.findings[0],
        status: "BLOCKED",
        blockers: ["Address invalid."],
      },
    ],
  });
  assert.match(output, /Status: TEAM_BLOCKED/);
  assert.match(output, /base-demo: Address invalid/);
  assert.match(output, /Blocker: Address invalid/);
});

test("report: always states the plan-only safety boundary", () => {
  const output = formatTeamReport(result);
  assert.match(output, /No RPC, Horizon, wallet, signing, bridge/);
  assert.match(output, /No private key, seed phrase, signature/);
});
