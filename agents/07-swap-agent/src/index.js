import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { parseSwapRequest } from "./parseSwap.js";
import { validateSwapRequest } from "./validateSwap.js";
import { getSolBalance } from "./balance.js";
import { getSwapQuote } from "./raydium.js";
import { checkQuoteSafety } from "./checkQuote.js";
import { checkSolBalance } from "./checkBalance.js";
import { prepareSwapTransaction } from "./prepareSwap.js";
import { exportPreparedSwap } from "./exportSwap.js";

const readline = createInterface({ input, output });

try {
  console.log("\nSWAP AGENT\n");

  const request = await readline.question(
    "What would you like to swap? "
  );

  const parsed = await parseSwapRequest(request);

  if (parsed.wallet === "UNKNOWN") {
    parsed.wallet = await readline.question(
      "Enter your Solana Devnet wallet address: "
    );

    parsed.missingInfo = parsed.missingInfo.filter(
      (item) => item.toLowerCase() !== "wallet"
    );
  }

  if (parsed.slippage === "UNKNOWN") {
    parsed.slippage = await readline.question(
      "Enter slippage tolerance in percent: "
    );

    parsed.missingInfo = parsed.missingInfo.filter(
      (item) => item.toLowerCase() !== "slippage"
    );
  }

  const validated = validateSwapRequest(parsed);

  console.log("\n--- VALIDATED SWAP REQUEST ---\n");
  console.log(JSON.stringify(validated, null, 2));

  const solBalance = await getSolBalance(validated.wallet);

  console.log("\n--- DEVNET BALANCE ---\n");
  console.log(`SOL: ${solBalance}`);

  checkSolBalance({
    fromAsset: validated.fromAsset,
    amount: validated.amount,
    solBalance,
  });

  const quote = await getSwapQuote(validated);

  console.log("\n--- RAYDIUM DEVNET QUOTE ---\n");
  console.log(`Swap: ${quote.inputAmount} ${quote.fromAsset}`);
  console.log(
    `Estimated output: ${quote.estimatedOutput} ${quote.toAsset}`
  );
  console.log(`Slippage: ${quote.slippagePercent}%`);
  console.log(`Price impact: ${quote.priceImpactPercent}%`);
  console.log(`Route steps: ${quote.routeCount}`);

  checkQuoteSafety(quote);

  console.log("\nQuote passed safety checks.");

  const prepared = await prepareSwapTransaction({
    quote,
    wallet: validated.wallet,
  });

  console.log("\n--- TRANSACTION READY FOR APPROVAL ---\n");
  console.log("Network: Solana Devnet");
  console.log(`Wallet: ${validated.wallet}`);
  console.log(`Input: ${quote.inputAmount} ${quote.fromAsset}`);
  console.log(
    `Expected output: ${quote.estimatedOutput} ${quote.toAsset}`
  );
  console.log(`Slippage: ${quote.slippagePercent}%`);
  console.log(`Price impact: ${quote.priceImpactPercent}%`);
  console.log(
    `Estimated network fee: ${prepared.estimatedFeeSol} SOL`
  );
  console.log(
    `Prepared transactions: ${prepared.transactionCount}`
  );

  const approval = await readline.question(
    '\nType YES to approve this swap, or anything else to cancel: '
  );

  if (approval.trim().toUpperCase() !== "YES") {
    console.log(
      "\nSwap cancelled. Nothing was signed or submitted.\n"
    );
  } else {
    const outputFile = await exportPreparedSwap({
      prepared,
      quote,
      wallet: validated.wallet,
    });

    console.log("\nApproval received.");
    console.log(
      `Unsigned transaction exported to ${outputFile}`
    );
    console.log(
      "Nothing has been signed or submitted yet.\n"
    );
  }
} catch (error) {
  console.error(`\nError: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  readline.close();
}
