import {
  calculateUsd,
  formatGwei,
  formatNative,
  parseUnsignedInteger,
  WEI_PER_GWEI,
} from "./units.js";

function multiplyDecimal(value, multiplier) {
  const basisPoints = BigInt(Math.round(multiplier * 10_000));
  return (value * basisPoints + 9_999n) / 10_000n;
}

export function estimateNetworkFee({ snapshot, transaction, now = new Date() }) {
  const gasLimit = parseUnsignedInteger(transaction.gasLimit, "gasLimit");
  const l1DataFee = parseUnsignedInteger(
    snapshot.l1DataFeeWei ?? "0",
    "l1DataFeeWei"
  );

  let expectedFeePerGas;
  let maximumFeePerGas;
  if (snapshot.feeModel === "eip1559") {
    const baseFee = parseUnsignedInteger(snapshot.baseFeePerGasWei, "baseFeePerGasWei");
    const priorityFee = parseUnsignedInteger(
      snapshot.priorityFeePerGasWei,
      "priorityFeePerGasWei"
    );
    expectedFeePerGas = baseFee + priorityFee;
    maximumFeePerGas = multiplyDecimal(baseFee, transaction.baseFeeMultiplier) + priorityFee;
  } else {
    expectedFeePerGas = parseUnsignedInteger(snapshot.gasPriceWei, "gasPriceWei");
    maximumFeePerGas = expectedFeePerGas;
  }

  const expectedCostWei = expectedFeePerGas * gasLimit + l1DataFee;
  const maximumCostWei = maximumFeePerGas * gasLimit + l1DataFee;
  const expectedCostUsd = calculateUsd(expectedCostWei, snapshot.nativeTokenPriceUsd);
  const maximumCostUsd = calculateUsd(maximumCostWei, snapshot.nativeTokenPriceUsd);
  const observedAtMs = new Date(snapshot.observedAt).getTime();
  const clockDifferenceSeconds = Math.floor((now.getTime() - observedAtMs) / 1000);
  const ageSeconds = Math.max(0, clockDifferenceSeconds);
  const futureDated = clockDifferenceSeconds < -60;
  const stale = ageSeconds > snapshot.staleAfterSeconds || futureDated;

  const blockers = [];
  if (
    transaction.maxFeeGwei !== null &&
    maximumFeePerGas >
      BigInt(Math.round(transaction.maxFeeGwei * Number(WEI_PER_GWEI)))
  ) {
    blockers.push(
      `Maximum fee ${formatGwei(maximumFeePerGas)} gwei exceeds the ${transaction.maxFeeGwei} gwei limit.`
    );
  }
  if (
    transaction.budgetUsd !== null &&
    maximumCostUsd !== null &&
    maximumCostUsd > transaction.budgetUsd
  ) {
    blockers.push(
      `Maximum cost $${maximumCostUsd.toFixed(6)} exceeds the $${transaction.budgetUsd.toFixed(2)} budget.`
    );
  }

  const status = blockers.length ? "OVER_LIMIT" : stale ? "REVIEW_STALE_DATA" : "READY";

  return {
    network: snapshot.name,
    chainId: snapshot.chainId,
    currencySymbol: snapshot.currencySymbol,
    source: snapshot.source,
    feeModel: snapshot.feeModel,
    observedAt: snapshot.observedAt,
    ageSeconds,
    futureDated,
    stale,
    expectedFeePerGasWei: expectedFeePerGas.toString(),
    expectedFeeGwei: formatGwei(expectedFeePerGas),
    maximumFeePerGasWei: maximumFeePerGas.toString(),
    maximumFeeGwei: formatGwei(maximumFeePerGas),
    expectedCostWei: expectedCostWei.toString(),
    expectedCostNative: formatNative(expectedCostWei),
    maximumCostWei: maximumCostWei.toString(),
    maximumCostNative: formatNative(maximumCostWei),
    expectedCostUsd,
    maximumCostUsd,
    l1DataFeeWei: l1DataFee.toString(),
    status,
    blockers,
  };
}

export function buildFeeReport({ snapshots, transaction, now = new Date() }) {
  const estimates = snapshots.map((snapshot) =>
    estimateNetworkFee({ snapshot, transaction, now })
  );
  const ready = estimates
    .filter(
      (estimate) =>
        estimate.status === "READY" && estimate.maximumCostUsd !== null
    )
    .sort((a, b) => a.maximumCostUsd - b.maximumCostUsd);

  return {
    generatedAt: now.toISOString(),
    transaction,
    estimates,
    bestFit: ready[0]?.network ?? null,
    readyCount: ready.length,
  };
}
