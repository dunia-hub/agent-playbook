import http from "node:http";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { getDefaultAsset } from "../src/assets.js";

const port = 4021;
const resourceUrl = `http://localhost:${port}/weather`;
const recipient = "0x1111111111111111111111111111111111111111";
const usdc = getDefaultAsset("eip155:84532", "USDC");

const paymentRequired = {
  x402Version: 2,
  resource: {
    url: resourceUrl,
    description: "Mock premium weather report",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: usdc.asset,
      amount: "10000",
      payTo: recipient,
      maxTimeoutSeconds: 60,
      extra: {
        name: usdc.name,
        version: usdc.version,
      },
    },
  ],
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" || request.url !== "/weather") {
    response.writeHead(404, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  response.writeHead(402, {
    "content-type": "application/json",
    "PAYMENT-REQUIRED":
      encodePaymentRequiredHeader(paymentRequired),
  });

  response.end(
    JSON.stringify({
      error: "Payment required",
      message:
        "This simulator advertises payment terms but never accepts funds.",
    }),
  );
});

server.listen(port, () => {
  console.log(`Mock x402 resource: ${resourceUrl}`);
  console.log("This simulator cannot settle payments.");
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
