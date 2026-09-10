import test from "node:test";
import assert from "node:assert/strict";
import {
  validatePlan,
  validatePolicy,
  validateRegistry,
  validateState,
} from "../src/validate.js";

const registryData = {
  networks: [
    {
      id: "base-sepolia",
      name: "Base Sepolia",
      family: "evm",
      testnet: true,
      nativeAsset: { symbol: "ETH", decimals: 18 },
    },
  ],
};
const stateData = {
  networks: {
    "base-sepolia": {
      balance: "1",
      estimatedFee: "0.001",
      minimumReserve: "0.01",
      observedAt: "2026-09-10T08:00:00Z",
      staleAfterSeconds: 300,
    },
  },
};
const policyData = {
  testnetOnly: true,
  requireFreshState: true,
  maxOperations: 3,
  allowedActions: ["prepare_native_transfer"],
  maxTransferByNetwork: { "base-sepolia": "0.1" },
};
const planData = {
  goal: "Prepare one test transfer",
  executionMode: "plan_only",
  operations: [
    {
      id: "base-demo",
      network: "base-sepolia",
      action: "prepare_native_transfer",
      destination: "0x1111111111111111111111111111111111111111",
      amount: "0.01",
      dependsOn: [],
    },
  ],
  notes: [],
};

test("validation: validates registry, state, policy, and plan", () => {
  const registry = validateRegistry(registryData);
  const state = validateState(stateData, registry);
  const policy = validatePolicy(policyData, registry);
  const plan = validatePlan(planData, registry, policy);
  assert.equal(state.networks["base-sepolia"].balance, "1");
  assert.equal(plan.operations[0].id, "base-demo");
});

test("registry: rejects empty and duplicate networks", () => {
  assert.throws(() => validateRegistry({ networks: [] }), /empty/);
  assert.throws(
    () => validateRegistry({ networks: [registryData.networks[0], registryData.networks[0]] }),
    /Duplicate network id/
  );
});

test("registry: rejects unsupported families and invalid assets", () => {
  assert.throws(
    () => validateRegistry({ networks: [{ ...registryData.networks[0], family: "bitcoin" }] }),
    /family is unsupported/
  );
  assert.throws(
    () =>
      validateRegistry({
        networks: [{ ...registryData.networks[0], nativeAsset: { symbol: "ETH", decimals: 31 } }],
      }),
    /nativeAsset is invalid/
  );
});

test("state: requires every registered network", () => {
  const registry = validateRegistry(registryData);
  assert.throws(() => validateState({ networks: {} }, registry), /Missing state/);
});

test("state: validates decimal values and timestamps", () => {
  const registry = validateRegistry(registryData);
  assert.throws(
    () =>
      validateState(
        { networks: { "base-sepolia": { ...stateData.networks["base-sepolia"], balance: -1 } } },
        registry
      ),
    /decimal string/
  );
  assert.throws(
    () =>
      validateState(
        {
          networks: {
            "base-sepolia": { ...stateData.networks["base-sepolia"], observedAt: "yesterday" },
          },
        },
        registry
      ),
    /observedAt is invalid/
  );
});

test("policy: validates operation limits and network ceilings", () => {
  const registry = validateRegistry(registryData);
  assert.throws(
    () => validatePolicy({ ...policyData, maxOperations: 0 }, registry),
    /from 1 to 20/
  );
  assert.throws(
    () => validatePolicy({ ...policyData, maxTransferByNetwork: {} }, registry),
    /decimal string/
  );
  assert.throws(
    () =>
      validatePolicy(
        { ...policyData, maxTransferByNetwork: { "base-sepolia": "0" } },
        registry
      ),
    /greater than zero/
  );
});

test("plan: enforces plan-only mode and exact top-level keys", () => {
  const registry = validateRegistry(registryData);
  const policy = validatePolicy(policyData, registry);
  assert.throws(
    () => validatePlan({ ...planData, executionMode: "execute" }, registry, policy),
    /plan_only/
  );
  assert.throws(
    () => validatePlan({ ...planData, privateKey: "secret" }, registry, policy),
    /unsupported keys/
  );
});

test("plan: rejects too many operations", () => {
  const registry = validateRegistry(registryData);
  const policy = validatePolicy({ ...policyData, maxOperations: 1 }, registry);
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [planData.operations[0], { ...planData.operations[0], id: "two" }] },
        registry,
        policy
      ),
    /exceeds the 1-operation/
  );
});

test("plan: rejects duplicate IDs and unknown networks", () => {
  const registry = validateRegistry(registryData);
  const policy = validatePolicy(policyData, registry);
  assert.throws(
    () => validatePlan({ ...planData, operations: [planData.operations[0], planData.operations[0]] }, registry, policy),
    /Duplicate operation id/
  );
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [{ ...planData.operations[0], network: "unknown" }] },
        registry,
        policy
      ),
    /unknown network/
  );
});

test("plan: rejects disallowed actions and zero amounts", () => {
  const registry = validateRegistry(registryData);
  const policy = validatePolicy(policyData, registry);
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [{ ...planData.operations[0], action: "bridge" }] },
        registry,
        policy
      ),
    /not allowed/
  );
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [{ ...planData.operations[0], amount: "0" }] },
        registry,
        policy
      ),
    /greater than zero/
  );
});

test("plan: validates dependency references", () => {
  const registry = validateRegistry(registryData);
  const policy = validatePolicy(policyData, registry);
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [{ ...planData.operations[0], dependsOn: ["missing"] }] },
        registry,
        policy
      ),
    /depends on unknown operation/
  );
  assert.throws(
    () =>
      validatePlan(
        { ...planData, operations: [{ ...planData.operations[0], dependsOn: ["base-demo"] }] },
        registry,
        policy
      ),
    /cannot depend on itself/
  );
});
