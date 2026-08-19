import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import {
  createPublicClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createPaymentPolicy } from "./policy.js";
import {
  appendPaymentRecord,
  createPaymentId,
  hasBlockingPayment,
} from "./paymentLog.js";

function getResourceUrl(context) {
  return context.paymentRequired.resource?.url ?? "unknown-resource";
}

export function createEvmPaymentClient(
  config,
  {
    fetchImpl = globalThis.fetch,
    approvePayment = async () => false,
  } = {},
) {
  if (!config.evmPrivateKey) {
    throw new Error(
      "EVM_PRIVATE_KEY is required before a payment can be created.",
    );
  }

  const evmNetworks = config.allowedNetworks.filter((network) =>
    network.startsWith("eip155:"),
  );

  if (evmNetworks.length === 0) {
    throw new Error(
      "At least one eip155 network is required for the EVM client.",
    );
  }

  const account = privateKeyToAccount(config.evmPrivateKey);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });
  const signer = toClientEvmSigner(account, publicClient);

  const client = x402Client.fromConfig({
    schemes: evmNetworks.map((network) => ({
      network,
      client: new ExactEvmScheme(signer),
    })),
    spendControls: {
      maxAmountPerPayment: `$${config.maxPaymentUsd}`,
    },
    policies: [createPaymentPolicy(config)],
  });

  client.onBeforePaymentCreation(async (context) => {
    const requirement = context.selectedRequirements;
    const resourceUrl = getResourceUrl(context);
    const paymentId = createPaymentId(resourceUrl, requirement);

    if (await hasBlockingPayment(config.logPath, paymentId)) {
      return {
        abort: true,
        reason:
          "This exact resource and payment have already been settled.",
      };
    }

    if (!config.autoApprove) {
      const approved = await approvePayment(context);

      if (!approved) {
        return {
          abort: true,
          reason: "Payment was not approved by the user.",
        };
      }
    }

    await appendPaymentRecord(config.logPath, {
      paymentId,
      status: "approved",
      resourceUrl,
      scheme: requirement.scheme,
      network: requirement.network,
      asset: requirement.asset,
      amount: requirement.amount,
      payTo: requirement.payTo,
    });
  });

  client.onPaymentResponse(async (context) => {
    const requirement = context.requirements;
    const resourceUrl =
      context.paymentPayload.resource?.url ?? "unknown-resource";
    const paymentId = createPaymentId(resourceUrl, requirement);
    const settled = context.settleResponse?.success === true;
    const pending =
      context.settleResponse?.errorReason === "settlement_pending";

    await appendPaymentRecord(config.logPath, {
      paymentId,
      status: settled
        ? "settled"
        : pending
          ? "pending"
          : "failed",
      resourceUrl,
      network: requirement.network,
      asset: requirement.asset,
      amount: requirement.amount,
      payTo: requirement.payTo,
      transaction: context.settleResponse?.transaction ?? null,
      error:
        context.settleResponse?.errorMessage ??
        context.settleResponse?.errorReason ??
        context.error?.message ??
        context.paymentRequired?.error ??
        null,
    });
  });

  return {
    client,
    fetchWithPayment: wrapFetchWithPayment(fetchImpl, client),
    signerAddress: signer.address,
    networks: evmNetworks,
  };
}
