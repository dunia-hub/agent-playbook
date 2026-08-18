import { getSwapQuote } from "../src/raydium.js";

const amounts = [
  "0.001",
  "0.002",
  "0.005",
  "0.01",
  "0.02",
  "0.05",
  "0.1",
  "0.2",
  "0.5",
];

console.log("\nSearching Raydium Devnet for a quote below 5% price impact...\n");

let found = false;

for (const amount of amounts) {
  try {
    const quote = await getSwapQuote({
      fromAsset: "SOL",
      toAsset: "USDC",
      amount,
      slippage: "0.5",
    });

    const impact = Number(quote.priceImpactPercent);

    console.log(
      `${amount} SOL -> ${quote.estimatedOutput} USDC | impact: ${impact}%`
    );

    if (impact <= 5) {
      console.log(
        `\nSAFE DEMO FOUND: Swap ${amount} SOL for USDC`
      );
      console.log(`Price impact: ${impact}%`);
      found = true;
      break;
    }
  } catch (error) {
    console.log(`${amount} SOL -> unavailable`);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
}

if (!found) {
  console.log(
    "\nNo SOL/USDC quote under 5% was available on Raydium Devnet right now."
  );
}
