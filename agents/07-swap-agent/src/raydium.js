import { getToken } from "./tokens.js";

const RAYDIUM_SWAP_HOST =
  "https://transaction-v1-devnet.raydium.io";

function toBaseUnits(amount, decimals) {
  const value = String(amount);
  const [whole, fraction = ""] = value.split(".");

  if (fraction.length > decimals) {
    throw new Error(
      `Amount has more than ${decimals} decimal places.`
    );
  }

  const paddedFraction = fraction.padEnd(decimals, "0");

  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(paddedFraction || "0")
  );
}

export async function getSwapQuote({
  fromAsset,
  toAsset,
  amount,
  slippage,
}) {
  const inputToken = getToken(fromAsset);
  const outputToken = getToken(toAsset);

  if (!inputToken) {
    throw new Error(`Unsupported input asset: ${fromAsset}`);
  }

  if (!outputToken) {
    throw new Error(`Unsupported output asset: ${toAsset}`);
  }

  const inputAmount = toBaseUnits(
    amount,
    inputToken.decimals
  );

  const slippageBps = Math.round(
    Number(slippage) * 100
  );

  const params = new URLSearchParams({
    inputMint: inputToken.mint,
    outputMint: outputToken.mint,
    amount: inputAmount.toString(),
    slippageBps: slippageBps.toString(),
    txVersion: "V0",
  });

  const response = await fetch(
    `${RAYDIUM_SWAP_HOST}/compute/swap-base-in?${params}`
  );

  if (!response.ok) {
    throw new Error(
      `Raydium quote request failed with status ${response.status}.`
    );
  }

  const quote = await response.json();

  if (!quote.success || !quote.data) {
    throw new Error(
      `No Raydium Devnet route found: ${
        quote.msg || "route unavailable"
      }`
    );
  }

  const outputAmount =
    Number(quote.data.outputAmount) /
    10 ** outputToken.decimals;

  return {
    fromAsset: inputToken.symbol,
    toAsset: outputToken.symbol,
    inputAmount: Number(amount),
    estimatedOutput: outputAmount,
    slippagePercent: Number(slippage),
    priceImpactPercent: quote.data.priceImpactPct,
    routeCount: quote.data.routePlan?.length ?? 0,
    rawQuote: quote,
  };
}
