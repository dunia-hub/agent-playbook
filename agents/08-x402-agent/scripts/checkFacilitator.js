import "dotenv/config";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { discoverPaymentRequirements } from "../src/discover.js";

const resourceUrl =
  process.argv[2] ??
  process.env.X402_RESOURCE_URL ??
  "http://localhost:4021/weather/base";

const privateKey = process.env.EVM_PRIVATE_KEY;

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "EVM_PRIVATE_KEY must contain a disposable EVM test-wallet private key.",
  );
}

const account = privateKeyToAccount(privateKey);

const discovery = await discoverPaymentRequirements(resourceUrl);

if (!discovery.requiresPayment) {
  throw new Error(
    `${resourceUrl} did not return an x402 payment requirement.`,
  );
}

const paymentRequired = discovery.paymentRequired;
const requirement = paymentRequired.accepts[0];

const scheme = new ExactEvmScheme(account);
const created = await scheme.createPaymentPayload(
  paymentRequired.x402Version,
  requirement,
);

const facilitator = new HTTPFacilitatorClient({
  url:
    process.env.X402_FACILITATOR_URL ??
    "http://127.0.0.1:4022",
});

const result = await facilitator.verify(
  {
    ...created,
    resource: paymentRequired.resource,
    accepted: requirement,
  },
  requirement,
);

console.log(`Resource: ${resourceUrl}`);
console.log(`Network: ${requirement.network}`);
console.log(`Payer: ${account.address}`);
console.log(JSON.stringify(result, null, 2));

if (!result.isValid) {
  process.exitCode = 1;
}
