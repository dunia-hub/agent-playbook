import "dotenv/config";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { discoverPaymentRequirements } from "../src/discover.js";

const resourceUrl =
  process.argv[2] ??
  process.env.X402_RESOURCE_URL ??
  "http://localhost:4021/weather";

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY);
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
const signer = toClientEvmSigner(account, publicClient);
const discovery =
  await discoverPaymentRequirements(resourceUrl);
const paymentRequired = discovery.paymentRequired;
const requirement = paymentRequired.accepts[0];

const scheme = new ExactEvmScheme(signer);
const created =
  await scheme.createPaymentPayload(2, requirement);

const facilitator = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

const result = await facilitator.verify(
  {
    ...created,
    resource: paymentRequired.resource,
    accepted: requirement,
  },
  requirement,
);

console.log(JSON.stringify(result, null, 2));
