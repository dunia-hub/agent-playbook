import test from "node:test";
import assert from "node:assert/strict";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { discoverPaymentRequirements } from "../src/discover.js";

const paymentRequired = {
  x402Version: 2,
  resource: {
    url: "https://example.com/weather",
    description: "Weather report",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: "USDC",
      amount: "10000",
      payTo: "0x1111111111111111111111111111111111111111",
      maxTimeoutSeconds: 60,
      extra: {},
    },
  ],
};

function createPaymentRequiredResponse(requirements) {
  return new Response(null, {
    status: 402,
    headers: {
      "PAYMENT-REQUIRED": encodePaymentRequiredHeader(requirements),
    },
  });
}

test("discovers payment requirements from a v2 header", async () => {
  const fetchImpl = async () =>
    createPaymentRequiredResponse(paymentRequired);

  const result = await discoverPaymentRequirements(
    "https://example.com/weather",
    { fetchImpl },
  );

  assert.equal(result.requiresPayment, true);
  assert.equal(result.status, 402);
  assert.equal(result.paymentRequired.x402Version, 2);
  assert.equal(result.paymentRequired.accepts.length, 1);
  assert.equal(
    result.paymentRequired.accepts[0].network,
    "eip155:84532",
  );
});

test("reports when a resource does not require payment", async () => {
  const fetchImpl = async () =>
    new Response('{"weather":"sunny"}', { status: 200 });

  const result = await discoverPaymentRequirements(
    "https://example.com/weather",
    { fetchImpl },
  );

  assert.equal(result.requiresPayment, false);
  assert.equal(result.status, 200);
  assert.equal(result.paymentRequired, null);
  assert.equal(await result.response.text(), '{"weather":"sunny"}');
});

test("rejects an invalid resource URL before fetching", async () => {
  await assert.rejects(
    discoverPaymentRequirements("not-a-url", {
      fetchImpl: async () => {
        throw new Error("fetch should not run");
      },
    }),
    /valid URL/,
  );
});

test("rejects a 402 response without usable requirements", async () => {
  const fetchImpl = async () =>
    createPaymentRequiredResponse({
      ...paymentRequired,
      accepts: [],
    });

  await assert.rejects(
    discoverPaymentRequirements("https://example.com/weather", {
      fetchImpl,
    }),
    /without usable payment requirements/,
  );
});
