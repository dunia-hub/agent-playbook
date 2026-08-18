import { PublicKey } from "@solana/web3.js";

export function validateSwapRequest(swap) {
  if (!swap || typeof swap !== "object") {
    throw new Error("Invalid swap request.");
  }

  if (swap.fromAsset === "UNKNOWN") {
    throw new Error("The asset to swap from is missing.");
  }

  if (swap.toAsset === "UNKNOWN") {
    throw new Error("The asset to swap to is missing.");
  }

  if (swap.amount === "UNKNOWN") {
    throw new Error("The swap amount is missing.");
  }

  const amount = Number(swap.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Swap amount must be greater than zero.");
  }

  if (
    swap.fromAsset.toUpperCase() ===
    swap.toAsset.toUpperCase()
  ) {
    throw new Error("The two swap assets must be different.");
  }

  if (swap.wallet && swap.wallet !== "UNKNOWN") {
    try {
      new PublicKey(swap.wallet);
    } catch {
      throw new Error("Invalid Solana wallet address.");
    }
  }

  if (swap.slippage !== "UNKNOWN") {
    const slippage = Number(swap.slippage);

    if (
      !Number.isFinite(slippage) ||
      slippage < 0 ||
      slippage > 100
    ) {
      throw new Error(
        "Slippage must be a number between 0 and 100."
      );
    }
  }

  return swap;
}
