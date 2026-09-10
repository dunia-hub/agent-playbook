import test from "node:test";
import assert from "node:assert/strict";
import { runAgentTeam } from "../src/coordinator.js";
import { preflightPolicy } from "../src/policy.js";

const registry = {
  networks: [
    { id: "base", name: "Base Sepolia", family: "evm", testnet: true, nativeAsset: { symbol: "ETH", decimals: 18 } },
    { id: "solana", name: "Solana Devnet", family: "solana", testnet: true, nativeAsset: { symbol: "SOL", decimals: 9 } },
    { id: "stellar", name: "Stellar Testnet", family: "stellar", testnet: true, nativeAsset: { symbol: "XLM", decimals: 7 } },
  ],
};
const state = {
  networks: {
    base: { balance: "1", estimatedFee: "0.001", minimumReserve: "0.01", observedAt: "2026-09-10T08:00:00Z", staleAfterSeconds: 300 },
    solana: { balance: "2", estimatedFee: "0.000005", minimumReserve: "0.05", observedAt: "2026-09-10T08:00:00Z", staleAfterSeconds: 300 },
    stellar: { balance: "50", estimatedFee: "0.00001", minimumReserve: "1", observedAt: "2026-09-10T08:00:00Z", staleAfterSeconds: 300 },
  },
};
const policy = {
  testnetOnly: true,
  requireFreshState: true,
  maxTransferByNetwork: { base: "0.1", solana: "0.5", stellar: "10" },
};
const plan = {
  goal: "Prepare three demos",
  executionMode: "plan_only",
  notes: [],
  operations: [
    { id: "base-demo", network: "base", action: "prepare_native_transfer", destination: "0x1111111111111111111111111111111111111111", amount: "0.01", dependsOn: [] },
    { id: "solana-demo", network: "solana", action: "prepare_native_transfer", destination: "4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw", amount: "0.1", dependsOn: ["base-demo"] },
    { id: "stellar-demo", network: "stellar", action: "prepare_native_transfer", destination: "GD7757P47P5PT6HX6327J47S6HYO73XN5TV6V2PI47TOLZHD4LQ6AE5T", amount: "5", dependsOn: ["solana-demo"] },
  ],
};
const now = new Date("2026-09-10T08:02:00Z");

test("coordinator: reaches consensus across three specialist families", async () => {
  const result = await runAgentTeam({ plan, registry, state, policy, now });
  assert.equal(result.status, "TEAM_READY");
  assert.deepEqual(result.executionOrder, ["base-demo", "solana-demo", "stellar-demo"]);
  assert.deepEqual(
    result.findings.map((finding) => finding.specialist),
    ["EVM Specialist", "Solana Specialist", "Stellar Specialist"]
  );
});

test("coordinator: never authorizes execution or creates transactions", async () => {
  const result = await runAgentTeam({ plan, registry, state, policy, now });
  assert.equal(result.executionAuthorized, false);
  assert.deepEqual(result.signatures, []);
  assert.deepEqual(result.transactions, []);
  assert.ok(result.findings.every((finding) => !finding.signatureRequested));
});

test("coordinator: propagates a blocked dependency", async () => {
  const blockedPlan = structuredClone(plan);
  blockedPlan.operations[0].destination = "bad-address";
  const result = await runAgentTeam({ plan: blockedPlan, registry, state, policy, now });
  assert.equal(result.status, "TEAM_BLOCKED");
  assert.match(result.findings[1].blockers.at(-1), /base-demo/);
  assert.match(result.findings[2].blockers.at(-1), /solana-demo/);
});

test("coordinator: keeps independent operations ready when another is blocked", async () => {
  const independent = structuredClone(plan);
  independent.operations[1].dependsOn = [];
  independent.operations[2].dependsOn = [];
  independent.operations[0].destination = "bad-address";
  const result = await runAgentTeam({ plan: independent, registry, state, policy, now });
  assert.equal(result.findings[0].status, "BLOCKED");
  assert.equal(result.findings[1].status, "READY");
  assert.equal(result.findings[2].status, "READY");
});

test("policy preflight: blocks a non-testnet target", () => {
  const mainnetRegistry = {
    networks: registry.networks.map((network) =>
      network.id === "base" ? { ...network, testnet: false } : network
    ),
  };
  const result = preflightPolicy({ plan, registry: mainnetRegistry, policy });
  assert.equal(result.passed, false);
  assert.match(result.blockers[0], /non-testnet/);
});

test("coordinator: includes preflight failures in consensus", async () => {
  const mainnetRegistry = {
    networks: registry.networks.map((network) =>
      network.id === "base" ? { ...network, testnet: false } : network
    ),
  };
  const result = await runAgentTeam({ plan, registry: mainnetRegistry, state, policy, now });
  assert.equal(result.status, "TEAM_BLOCKED");
  assert.match(result.blockers[0], /non-testnet/);
});
