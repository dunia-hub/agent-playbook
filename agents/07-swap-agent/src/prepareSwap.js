import {
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { connection } from "./solana.js";
import { getToken } from "./tokens.js";

const RAYDIUM_SWAP_HOST =
  "https://transaction-v1-devnet.raydium.io";

const PRIORITY_FEE_MICRO_LAMPORTS = "50000";

export async function prepareSwapTransaction({
  quote,
  wallet,
}) {
  if (!quote?.rawQuote) {
    throw new Error("A valid Raydium quote is required.");
  }

  const inputToken = getToken(quote.fromAsset);
  const outputToken = getToken(quote.toAsset);

  if (!inputToken || !outputToken) {
    throw new Error("Unsupported token in swap quote.");
  }

  const response = await fetch(
    `${RAYDIUM_SWAP_HOST}/transaction/swap-base-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        computeUnitPriceMicroLamports:
          PRIORITY_FEE_MICRO_LAMPORTS,
        swapResponse: quote.rawQuote,
        txVersion: "V0",
        wallet,
        wrapSol: inputToken.native,
        unwrapSol: outputToken.native,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Raydium transaction preparation failed with status ${response.status}.`
    );
  }

  const built = await response.json();

  if (!built.success || !Array.isArray(built.data)) {
    throw new Error(
      `Raydium could not prepare the transaction: ${
        built.msg || "unknown error"
      }`
    );
  }

  const transactions = built.data.map((entry) => {
    const bytes = Buffer.from(entry.transaction, "base64");
    return VersionedTransaction.deserialize(bytes);
  });

  let estimatedFeeLamports = 0;

  for (const transaction of transactions) {
    const fee = await connection.getFeeForMessage(
      transaction.message,
      "confirmed"
    );

    estimatedFeeLamports += fee.value ?? 0;
  }

  return {
    transactions,
    transactionCount: transactions.length,
    estimatedFeeLamports,
    estimatedFeeSol:
      estimatedFeeLamports / LAMPORTS_PER_SOL,
  };
}
