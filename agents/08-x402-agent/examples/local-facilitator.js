import "dotenv/config";
import express from "express";
import { x402Facilitator } from "@x402/core/facilitator";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import {
  createWalletClient,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  avalancheFuji,
  baseSepolia,
} from "viem/chains";

const BASE_NETWORK = "eip155:84532";
const FUJI_NETWORK = "eip155:43113";

const port = Number(
  process.env.X402_FACILITATOR_PORT ?? "4022",
);

const commonPrivateKey =
  process.env.X402_FACILITATOR_PRIVATE_KEY ??
  process.env.TEST_RECEIVER_PRIVATE_KEY;

const basePrivateKey =
  process.env.X402_BASE_FACILITATOR_PRIVATE_KEY ??
  commonPrivateKey;

const fujiPrivateKey =
  process.env.X402_FUJI_FACILITATOR_PRIVATE_KEY ??
  commonPrivateKey;

const baseRpcUrl =
  process.env.BASE_SEPOLIA_RPC_URL ??
  "https://sepolia.base.org";

const fujiRpcUrl =
  process.env.AVALANCHE_FUJI_RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

function validatePrivateKey(privateKey, name) {
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      `${name} must contain a disposable EVM test-wallet private key.`,
    );
  }
}

validatePrivateKey(
  basePrivateKey,
  "X402_BASE_FACILITATOR_PRIVATE_KEY",
);
validatePrivateKey(
  fujiPrivateKey,
  "X402_FUJI_FACILITATOR_PRIVATE_KEY",
);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "X402_FACILITATOR_PORT must be a valid TCP port.",
  );
}

function createFacilitatorSigner({
  privateKey,
  chain,
  rpcUrl,
}) {
  const account = privateKeyToAccount(privateKey);

  const viemClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);

  const signer = toFacilitatorEvmSigner(
    {
      ...viemClient,
      address: account.address,
    },
    {
      confirmationTimeoutMs: 25_000,
    },
  );

  return {
    signer,
    address: account.address,
  };
}

const base = createFacilitatorSigner({
  privateKey: basePrivateKey,
  chain: baseSepolia,
  rpcUrl: baseRpcUrl,
});

const fuji = createFacilitatorSigner({
  privateKey: fujiPrivateKey,
  chain: avalancheFuji,
  rpcUrl: fujiRpcUrl,
});

const facilitator = new x402Facilitator()
  .register(
    BASE_NETWORK,
    new ExactEvmScheme(base.signer, {
      simulateInSettle: true,
    }),
  )
  .register(
    FUJI_NETWORK,
    new ExactEvmScheme(fuji.signer, {
      simulateInSettle: true,
    }),
  );

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

function readRequestBody(request) {
  const { paymentPayload, paymentRequirements } =
    request.body ?? {};

  if (!paymentPayload || !paymentRequirements) {
    throw new Error(
      "paymentPayload and paymentRequirements are required.",
    );
  }

  return { paymentPayload, paymentRequirements };
}

app.get("/supported", (_request, response) => {
  response.json(facilitator.getSupported());
});

app.post("/verify", async (request, response) => {
  try {
    const { paymentPayload, paymentRequirements } =
      readRequestBody(request);

    const result = await facilitator.verify(
      paymentPayload,
      paymentRequirements,
    );

    response.json(result);
  } catch (error) {
    response.status(400).json({
      isValid: false,
      invalidReason: "facilitator_verify_error",
      invalidMessage: error.message,
    });
  }
});

app.post("/settle", async (request, response) => {
  const network =
    request.body?.paymentRequirements?.network ??
    "unknown";

  try {
    const { paymentPayload, paymentRequirements } =
      readRequestBody(request);

    const result = await facilitator.settle(
      paymentPayload,
      paymentRequirements,
    );

    response.json(result);
  } catch (error) {
    response.status(500).json({
      success: false,
      errorReason: "facilitator_settle_error",
      errorMessage: error.message,
      transaction: "",
      network,
    });
  }
});

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    networks: [
      {
        network: BASE_NETWORK,
        name: "Base Sepolia",
        signer: base.address,
      },
      {
        network: FUJI_NETWORK,
        name: "Avalanche Fuji",
        signer: fuji.address,
      },
    ],
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(
    `Local facilitator: http://127.0.0.1:${port}`,
  );
  console.log(
    `Base Sepolia: ${BASE_NETWORK} (${base.address})`,
  );
  console.log(
    `Avalanche Fuji: ${FUJI_NETWORK} (${fuji.address})`,
  );
});
