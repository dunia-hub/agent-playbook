import http from "node:http";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { getDefaultAsset } from "../src/assets.js";

const port = Number(process.env.X402_SERVER_PORT ?? "4021");
const recipient =
  "0x1111111111111111111111111111111111111111";

const resources = {
  "/weather/base": {
    network: "eip155:84532",
    description: "Mock Base Sepolia weather report",
  },
  "/weather/avalanche": {
    network: "eip155:43113",
    description: "Mock Avalanche Fuji weather report",
  },
};

function createPaymentRequired(path, resource) {
  const usdc = getDefaultAsset(resource.network, "USDC");

  return {
    x402Version: 2,
    resource: {
      url: `http://localhost:${port}${path}`,
      description: resource.description,
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: resource.network,
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
}

const server = http.createServer((request, response) => {
  const resource = resources[request.url];

  if (request.method !== "GET" || !resource) {
    response.writeHead(404, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const paymentRequired = createPaymentRequired(
    request.url,
    resource,
  );

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
  console.log(
    `Mock Base resource: http://localhost:${port}/weather/base`,
  );
  console.log(
    `Mock Avalanche resource: http://localhost:${port}/weather/avalanche`,
  );
  console.log("This simulator cannot settle payments.");
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
