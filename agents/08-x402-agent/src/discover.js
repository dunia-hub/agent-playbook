import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";

function validateResourceUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Resource URL must be a valid URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Resource URL must use HTTP or HTTPS.");
  }

  return url.toString();
}

export async function discoverPaymentRequirements(
  resourceUrl,
  {
    fetchImpl = globalThis.fetch,
    httpClient = new x402HTTPClient(new x402Client()),
  } = {},
) {
  const url = validateResourceUrl(resourceUrl);

  const response = await fetchImpl(url, {
    method: "GET",
    redirect: "error",
  });

  if (response.status !== 402) {
    return {
      requiresPayment: false,
      status: response.status,
      paymentRequired: null,
      response,
    };
  }

  let body;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
    body,
  );

  if (
    !paymentRequired ||
    !Array.isArray(paymentRequired.accepts) ||
    paymentRequired.accepts.length === 0
  ) {
    throw new Error(
      "The server returned HTTP 402 without usable payment requirements.",
    );
  }

  return {
    requiresPayment: true,
    status: response.status,
    paymentRequired,
    response,
  };
}
