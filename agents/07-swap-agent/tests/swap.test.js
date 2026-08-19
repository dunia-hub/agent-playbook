import test from "node:test";
import assert from "node:assert/strict";

import { validateSwapRequest } from "../src/validateSwap.js";
import { checkSolBalance } from "../src/checkBalance.js";
import { checkQuoteSafety } from "../src/checkQuote.js";
import { getToken } from "../src/tokens.js";

const validSwap = {
  fromAsset: "SOL",
  toAsset: "USDC",
  amount: "0.1",
  wallet: "EryAsEKCzsDB91FnEEAnNTfmGmYBqmei98fQ3VUd4QGj",
  slippage: "0.5",
  missingInfo: [],
};

test("accepts a valid swap request", () => {
  assert.equal(validateSwapRequest(validSwap), validSwap);
});

test("rejects a zero swap amount", () => {
  assert.throws(
    () =>
      validateSwapRequest({
        ...validSwap,
        amount: "0",
      }),
    /greater than zero/
  );
});

test("rejects swapping an asset to itself", () => {
  assert.throws(
    () =>
      validateSwapRequest({
        ...validSwap,
        toAsset: "SOL",
      }),
    /must be different/
  );
});

test("rejects an invalid Solana wallet", () => {
  assert.throws(
    () =>
      validateSwapRequest({
        ...validSwap,
        wallet: "not-a-wallet",
      }),
    /Invalid Solana wallet/
  );
});

test("rejects invalid slippage", () => {
  assert.throws(
    () =>
      validateSwapRequest({
        ...validSwap,
        slippage: "150",
      }),
    /between 0 and 100/
  );
});

test("rejects insufficient SOL balance", () => {
  assert.throws(
    () =>
      checkSolBalance({
        fromAsset: "SOL",
        amount: "10",
        solBalance: 5,
      }),
    /Insufficient SOL balance/
  );
});

test("blocks a quote with unsafe price impact", () => {
  assert.throws(
    () =>
      checkQuoteSafety({
        priceImpactPercent: 6.62,
      }),
    /Swap blocked/
  );
});

test("recognizes supported tokens", () => {
  assert.equal(getToken("SOL").symbol, "SOL");
  assert.equal(getToken("USDC").symbol, "USDC");
});
