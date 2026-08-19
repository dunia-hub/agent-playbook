export function checkSolBalance({
  fromAsset,
  amount,
  solBalance,
}) {
  if (fromAsset.toUpperCase() !== "SOL") {
    return;
  }

  const requestedAmount = Number(amount);

  if (solBalance < requestedAmount) {
    throw new Error(
      `Insufficient SOL balance. Wallet has ${solBalance} SOL but the swap requests ${requestedAmount} SOL.`
    );
  }
}
