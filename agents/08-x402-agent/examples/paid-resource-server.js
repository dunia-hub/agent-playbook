import "dotenv/config";
import express from "express";
import {
  paymentMiddleware,
  x402ResourceServer,
} from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { isAddress } from "viem";

const network = "eip155:84532";
const facilitatorUrl = "https://x402.org/facilitator";
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

const facilitatorClient = new HTTPFacilitatorClient({
  url: facilitatorUrl,
});

const resourceServer = new x402ResourceServer(
  facilitatorClient,
).register(network, new ExactEvmScheme());

const app = express();

app.use(
  paymentMiddleware(
    {
      "GET /weather": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network,
            payTo,
          },
        ],
        description: "Premium Nairobi weather report",
        mimeType: "application/json",
      },
    },
    resourceServer,
  ),
);

app.get("/weather", (_request, response) => {
  response.json({
    city: "Nairobi",
    report: "Warm with a chance of builders shipping.",
    source: "Dunia Hub x402 workshop example",
    receivedAt: new Date().toISOString(),
  });
});

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    network,
    facilitator: facilitatorUrl,
  });
});

app.listen(port, () => {
  console.log(`Paid resource: http://localhost:${port}/weather`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Receiver: ${payTo}`);
  console.log(`Price: $0.01 USDC on Base Sepolia`);
});
