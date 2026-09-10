import test from "node:test";
import assert from "node:assert/strict";
import { runEvmSpecialist } from "../src/specialists/evm.js";
import { runSolanaSpecialist } from "../src/specialists/solana.js";
import { runStellarSpecialist } from "../src/specialists/stellar.js";

const now = new Date("2026-09-10T08:02:00Z");
const policy = {
  requireFreshState: true,
  maxTransferByNetwork: {
    evm: "0.1",
    solana: "0.5",
    stellar: "10",
  },
};
const state = {
  balance: "1",
  estimatedFee: "0.001",
  minimumReserve: "0.01",
  observedAt: "2026-09-10T08:00:00Z",
  staleAfterSeconds: 300,
};

function context({ family = "evm", destination, amount = "0.01" } = {}) {
  return {
    operation: {
      id: `${family}-demo`,
      action: "prepare_native_transfer",
      destination,
      amount,
    },
    network: {
      id: family,
      name: `${family} testnet`,
      family,
      nativeAsset: { symbol: family === "stellar" ? "XLM" : family === "solana" ? "SOL" : "ETH", decimals: family === "evm" ? 18 : family === "solana" ? 9 : 7 },
    },
    state: {
      ...state,
      balance: family === "stellar" ? "50" : family === "solana" ? "2" : "1",
    },
    policy,
    now,
  };
}

test("specialists: EVM specialist approves a valid bounded plan", () => {
  const result = runEvmSpecialist(
    context({ destination: "0x1111111111111111111111111111111111111111" })
  );
  assert.equal(result.status, "READY");
  assert.equal(result.specialist, "EVM Specialist");
  assert.ok(result.readOnlyCalls.includes("eth_getBalance"));
  assert.equal(result.transactionCreated, false);
});

test("specialists: Solana specialist uses Solana checks", () => {
  const result = runSolanaSpecialist(
    context({
      family: "solana",
      destination: "4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw",
      amount: "0.1",
    })
  );
  assert.equal(result.status, "READY");
  assert.ok(result.readOnlyCalls.includes("getFeeForMessage"));
});

test("specialists: Stellar specialist validates StrKey checksums", () => {
  const result = runStellarSpecialist(
    context({
      family: "stellar",
      destination: "GD7757P47P5PT6HX6327J47S6HYO73XN5TV6V2PI47TOLZHD4LQ6AE5T",
      amount: "5",
    })
  );
  assert.equal(result.status, "READY");
  assert.ok(result.readOnlyCalls.includes("GET /fee_stats"));
});

test("specialists: blocks invalid family-specific addresses", () => {
  const result = runEvmSpecialist(context({ destination: "not-an-address" }));
  assert.equal(result.status, "BLOCKED");
  assert.match(result.blockers[0], /valid evm address/);
});

test("specialists: blocks transfers over the policy limit", () => {
  const result = runEvmSpecialist(
    context({ destination: "0x1111111111111111111111111111111111111111", amount: "0.2" })
  );
  assert.equal(result.status, "BLOCKED");
  assert.match(result.blockers[0], /exceeds the 0.1 ETH policy limit/);
});

test("specialists: requires amount, fee, and reserve coverage", () => {
  const result = runEvmSpecialist({
    ...context({ destination: "0x1111111111111111111111111111111111111111" }),
    state: { ...state, balance: "0.015" },
  });
  assert.equal(result.status, "BLOCKED");
  assert.match(result.blockers[0], /cannot cover/);
});

test("specialists: blocks stale and future-dated state", () => {
  const base = context({ destination: "0x1111111111111111111111111111111111111111" });
  const stale = runEvmSpecialist({ ...base, state: { ...state, observedAt: "2026-09-10T07:00:00Z" } });
  const future = runEvmSpecialist({ ...base, state: { ...state, observedAt: "2026-09-10T09:00:00Z" } });
  assert.match(stale.blockers[0], /older than/);
  assert.match(future.blockers[0], /future-dated/);
});

test("specialists: can report stale state without blocking when policy allows", () => {
  const result = runEvmSpecialist({
    ...context({ destination: "0x1111111111111111111111111111111111111111" }),
    state: { ...state, observedAt: "2026-09-10T07:00:00Z" },
    policy: { ...policy, requireFreshState: false },
  });
  assert.equal(result.status, "READY");
});
