import test from "node:test";
import assert from "node:assert/strict";
import { createEvmPaymentClient } from "../src/paymentClient.js";

const testPrivateKey =
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const baseConfig = {
  evmPrivateKey: testPrivateKey,
  allowedNetworks: ["eip155:84532"],
  allowedAssets: ["USDC"],
  allowedRecipients: [],
  maxPaymentUsd: 0.1,
  autoApprove: false,
  logPath: "/tmp/x402-payment-client-test.jsonl",
};

test("requires a private key before creating a payment client", () => {
  assert.throws(
    () =>
      createEvmPaymentClient({
        ...baseConfig,
        evmPrivateKey: null,
      }),
    /EVM_PRIVATE_KEY is required/,
  );
});

test("requires an allowed EVM network", () => {
  assert.throws(
    () =>
      createEvmPaymentClient({
        ...baseConfig,
        allowedNetworks: ["stellar:testnet"],
      }),
    /At least one eip155 network/,
  );
});

test("creates a payment-enabled Base Sepolia client", () => {
  const result = createEvmPaymentClient(baseConfig);

  assert.equal(typeof result.fetchWithPayment, "function");
  assert.deepEqual(result.networks, ["eip155:84532"]);
  assert.match(result.signerAddress, /^0x[0-9a-fA-F]{40}$/);
});

test("creates a payment client for Base Sepolia and Avalanche Fuji", () => {
  const result = createEvmPaymentClient({
    ...baseConfig,
    allowedNetworks: [
      "eip155:84532",
      "eip155:43113",
    ],
  });

  assert.equal(typeof result.fetchWithPayment, "function");
  assert.deepEqual(result.networks, [
    "eip155:84532",
    "eip155:43113",
  ]);
  assert.match(result.signerAddress, /^0x[0-9a-fA-F]{40}$/);
});
