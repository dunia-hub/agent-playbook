import "dotenv/config";
import express from "express";
import {
  paymentMiddleware,
  x402ResourceServer,
} from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { isAddress } from "viem";
import { getDefaultAsset } from "../src/assets.js";

const BASE_NETWORK = "eip155:84532";
const FUJI_NETWORK = "eip155:43113";

const facilitatorUrl =
  process.env.X402_FACILITATOR_URL ??
  "http://127.0.0.1:4022";

const payTo = process.env.X402_SERVER_PAY_TO;
const port = Number(process.env.X402_SERVER_PORT ?? "4021");

if (!payTo || !isAddress(payTo)) {
  throw new Error(
    "X402_SERVER_PAY_TO must be a valid EVM receiver address.",
  );
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "X402_SERVER_PORT must be a valid TCP port number.",
  );
}

const fujiUsdc = getDefaultAsset(FUJI_NETWORK, "USDC");

const facilitatorClient = new HTTPFacilitatorClient({
  url: facilitatorUrl,
});

const resourceServer = new x402ResourceServer(
  facilitatorClient,
)
  .register(BASE_NETWORK, new ExactEvmScheme())
  .register(FUJI_NETWORK, new ExactEvmScheme());

const app = express();

app.use(
  paymentMiddleware(
    {
      "GET /weather/base": {
        accepts: {
          scheme: "exact",
          price: "$0.01",
          network: BASE_NETWORK,
          payTo,
        },
        description:
          "Premium Nairobi weather report on Base Sepolia",
        mimeType: "application/json",
      },
      "GET /weather/avalanche": {
        accepts: {
          scheme: "exact",
          price: {
            asset: fujiUsdc.asset,
            amount: "10000",
            extra: {
              name: fujiUsdc.name,
              version: fujiUsdc.version,
            },
          },
          network: FUJI_NETWORK,
          payTo,
        },
        description:
          "Premium Nairobi weather report on Avalanche Fuji",
        mimeType: "application/json",
      },
    },
    resourceServer,
  ),
);

function sendWeather(networkName) {
  return (_request, response) => {
    response.json({
      city: "Nairobi",
      report: "Warm with a chance of builders shipping.",
      network: networkName,
      source: "Dunia Hub x402 workshop example",
      receivedAt: new Date().toISOString(),
    });
  };
}

app.get(
  "/weather/base",
  sendWeather("Base Sepolia"),
);

app.get(
  "/weather/avalanche",
  sendWeather("Avalanche Fuji"),
);

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    facilitator: facilitatorUrl,
    paidResources: [
      {
        url: `http://localhost:${port}/weather/base`,
        network: BASE_NETWORK,
        price: "0.01 USDC",
      },
      {
        url: `http://localhost:${port}/weather/avalanche`,
        network: FUJI_NETWORK,
        price: "0.01 USDC",
      },
    ],
  });
});

app.listen(port, () => {
  console.log(
    `Base resource: http://localhost:${port}/weather/base`,
  );
  console.log(
    `Avalanche resource: http://localhost:${port}/weather/avalanche`,
  );
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Facilitator: ${facilitatorUrl}`);
  console.log(`Receiver: ${payTo}`);
  console.log("Price: 0.01 USDC per request");
});
