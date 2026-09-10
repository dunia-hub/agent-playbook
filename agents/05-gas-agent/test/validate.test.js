import test from "node:test";
import assert from "node:assert/strict";
import { validateNetworks, validateTransaction } from "../src/validate.js";

const snapshot = {
  name: "Base Sepolia",
  chainId: 84532,
  currencySymbol: "eth",
  source: "snapshot",
  feeModel: "eip1559",
  observedAt: "2026-09-10T06:00:00Z",
  baseFeePerGasWei: "10000000",
  priorityFeePerGasWei: "1000000",
};

test("validation: normalizes a snapshot network", () => {
  const result = validateNetworks({ networks: [snapshot] }).networks[0];
  assert.equal(result.currencySymbol, "ETH");
  assert.equal(result.staleAfterSeconds, 300);
  assert.equal(result.nativeTokenPriceUsd, null);
});

test("validation: accepts legacy fee snapshots", () => {
  const result = validateNetworks({
    networks: [{ ...snapshot, feeModel: "legacy", gasPriceWei: "30000000000" }],
  });
  assert.equal(result.networks[0].feeModel, "legacy");
});

test("validation: requires at least one network", () => {
  assert.throws(() => validateNetworks({ networks: [] }), /At least one/);
});

test("validation: rejects duplicate chain IDs", () => {
  assert.throws(
    () => validateNetworks({ networks: [snapshot, { ...snapshot, name: "Duplicate" }] }),
    /Duplicate chainId/
  );
});

test("validation: rejects malformed fee quantities", () => {
  assert.throws(
    () => validateNetworks({ networks: [{ ...snapshot, baseFeePerGasWei: "1.2" }] }),
    /unsigned integer/
  );
});

test("validation: requires an uppercase RPC environment name", () => {
  assert.throws(
    () =>
      validateNetworks({
        networks: [{ ...snapshot, source: "rpc", rpcEnv: "rpcUrl" }],
      }),
    /uppercase environment variable/
  );
});

test("validation: validates and normalizes a transaction", () => {
  const transaction = validateTransaction({
    name: " Token transfer ",
    gasLimit: "65000",
    budgetUsd: 0.1,
    maxFeeGwei: 30,
  });
  assert.equal(transaction.name, "Token transfer");
  assert.equal(transaction.baseFeeMultiplier, 2);
});

test("validation: constrains gas limits", () => {
  assert.throws(
    () => validateTransaction({ name: "Call", gasLimit: "20000" }),
    /between 21000/
  );
  assert.throws(
    () => validateTransaction({ name: "Call", gasLimit: "30000001" }),
    /between 21000/
  );
});

test("validation: constrains the base fee multiplier", () => {
  assert.throws(
    () =>
      validateTransaction({ name: "Call", gasLimit: "21000", baseFeeMultiplier: 6 }),
    /between 1 and 5/
  );
});

test("validation: validates optional user limits", () => {
  assert.throws(
    () => validateTransaction({ name: "Call", gasLimit: "21000", budgetUsd: 0 }),
    /positive number/
  );
});
