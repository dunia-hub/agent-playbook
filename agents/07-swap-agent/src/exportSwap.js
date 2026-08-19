import { mkdir, writeFile } from "node:fs/promises";

const OUTPUT_FILE = "signer/public/prepared-swap.json";

export async function exportPreparedSwap({
  prepared,
  quote,
  wallet,
}) {
  await mkdir("signer/public", { recursive: true });

  const transactions = prepared.transactions.map(
    (transaction) =>
      Buffer.from(transaction.serialize()).toString("base64")
  );

  const payload = {
    network: "devnet",
    wallet,
    input: {
      amount: quote.inputAmount,
      asset: quote.fromAsset,
    },
    expectedOutput: {
      amount: quote.estimatedOutput,
      asset: quote.toAsset,
    },
    slippagePercent: quote.slippagePercent,
    priceImpactPercent: quote.priceImpactPercent,
    estimatedFeeSol: prepared.estimatedFeeSol,
    transactions,
  };

  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(payload, null, 2)
  );

  return OUTPUT_FILE;
}
