import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultAsset } from "../src/assets.js";
import {
  createPaymentPolicy,
  evaluatePaymentRequirements,
  formatPaymentAmount,
} from "../src/policy.js";

const baseUsdc = getDefaultAsset("eip155:84532", "USDC");

const baseRequirement = {
  scheme: "exact",
  network: "eip155:84532",
  asset: baseUsdc.asset,
  amount: "10000",
  payTo: "0x1111111111111111111111111111111111111111",
  maxTimeoutSeconds: 60,
  extra: {},
};

const baseConfig = {
  allowedNetworks: ["eip155:84532"],
  allowedAssets: ["USDC"],
  allowedRecipients: [],
};

test("allows Base Sepolia USDC by its configured symbol", () => {
  const [result] = evaluatePaymentRequirements(
    [baseRequirement],
    baseConfig,
  );

  assert.equal(result.allowed, true);
  assert.equal(result.assetSymbol, "USDC");
  assert.deepEqual(result.reasons, []);
});

test("allows an asset configured by its onchain address", () => {
  const [result] = evaluatePaymentRequirements(
    [baseRequirement],
    {
      ...baseConfig,
      allowedAssets: [baseUsdc.asset],
    },
  );

  assert.equal(result.allowed, true);
});

test("rejects an asset outside the allowlist", () => {
  const [result] = evaluatePaymentRequirements(
    [baseRequirement],
    {
      ...baseConfig,
      allowedAssets: ["EURC"],
    },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reasons[0], /Asset is not allowed/);
});

test("rejects an unsupported payment scheme", () => {
  const [result] = evaluatePaymentRequirements(
    [{ ...baseRequirement, scheme: "upto" }],
    baseConfig,
  );

  assert.equal(result.allowed, false);
  assert.match(result.reasons[0], /Unsupported payment scheme/);
});

test("rejects a network outside the allowlist", () => {
  const [result] = evaluatePaymentRequirements(
    [{ ...baseRequirement, network: "eip155:1" }],
    baseConfig,
  );

  assert.equal(result.allowed, false);
  assert.match(
    result.reasons.find((reason) =>
      reason.includes("Network is not allowed"),
    ),
    /Network is not allowed/,
  );
});

test("rejects a recipient outside a configured allowlist", () => {
  const [result] = evaluatePaymentRequirements(
    [baseRequirement],
    {
      ...baseConfig,
      allowedRecipients: [
        "0x2222222222222222222222222222222222222222",
      ],
    },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reasons[0], /Recipient is not allowed/);
});

test("matches EVM recipient addresses without case sensitivity", () => {
  const policy = createPaymentPolicy({
    ...baseConfig,
    allowedRecipients: [baseRequirement.payTo.toUpperCase()],
  });

  assert.deepEqual(policy(2, [baseRequirement]), [baseRequirement]);
});

test("filters unsafe choices while retaining safe choices", () => {
  const policy = createPaymentPolicy(baseConfig);
  const unsafe = { ...baseRequirement, scheme: "upto" };

  assert.deepEqual(
    policy(2, [unsafe, baseRequirement]),
    [baseRequirement],
  );
});

test("formats an atomic USDC amount for user approval", () => {
  assert.equal(
    formatPaymentAmount({
      ...baseRequirement,
      amount: "10000",
    }),
    "0.01 USDC",
  );
});

test("preserves an unknown asset amount without guessing decimals", () => {
  assert.equal(
    formatPaymentAmount({
      ...baseRequirement,
      asset: "0x9999999999999999999999999999999999999999",
      amount: "250",
    }),
    "250 0x9999999999999999999999999999999999999999",
  );
});
