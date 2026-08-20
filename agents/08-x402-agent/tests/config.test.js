import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

test("loads safe defaults", () => {
  const config = loadConfig({});

  assert.equal(config.maxPaymentUsd, 0.1);
  assert.deepEqual(config.allowedNetworks, ["eip155:84532"]);
  assert.deepEqual(config.allowedAssets, ["USDC"]);
  assert.deepEqual(config.allowedRecipients, []);
  assert.equal(config.autoApprove, false);
  assert.equal(config.evmPrivateKey, null);
});

test("parses comma-separated allowlists", () => {
  const config = loadConfig({
    X402_ALLOWED_NETWORKS: "eip155:84532, stellar:testnet",
    X402_ALLOWED_ASSETS: "USDC, EURC",
    X402_ALLOWED_RECIPIENTS: "0xabc, 0xdef",
    X402_AUTO_APPROVE: "true",
  });

  assert.deepEqual(config.allowedNetworks, [
    "eip155:84532",
    "stellar:testnet",
  ]);
  assert.deepEqual(config.allowedAssets, ["USDC", "EURC"]);
  assert.deepEqual(config.allowedRecipients, ["0xabc", "0xdef"]);
  assert.equal(config.autoApprove, true);
});

test("rejects an invalid payment limit", () => {
  assert.throws(
    () => loadConfig({ X402_MAX_PAYMENT_USD: "zero" }),
    /positive number/,
  );
});

test("rejects an invalid approval setting", () => {
  assert.throws(
    () => loadConfig({ X402_AUTO_APPROVE: "yes" }),
    /must be true or false/,
  );
});

test("rejects a malformed private key", () => {
  assert.throws(
    () => loadConfig({ EVM_PRIVATE_KEY: "not-a-private-key" }),
    /0x-prefixed 32-byte private key/,
  );
});

test("requires a recipient allowlist for automatic approval", () => {
  assert.throws(
    () => loadConfig({ X402_AUTO_APPROVE: "true" }),
    /requires at least one X402_ALLOWED_RECIPIENTS/,
  );
});
