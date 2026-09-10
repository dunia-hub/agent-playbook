import { formatUnits, parseUnits } from "../units.js";

export function evaluateNativeTransfer({
  specialist,
  family,
  operation,
  network,
  state,
  policy,
  addressIsValid,
  readOnlyCalls,
  now,
}) {
  const blockers = [];
  const checks = [];
  if (network.family !== family) {
    blockers.push(`Expected ${family} network, received ${network.family}.`);
  }
  if (!addressIsValid(operation.destination)) {
    blockers.push(`Destination is not a valid ${family} address.`);
  } else {
    checks.push(`Destination passed ${family} address validation.`);
  }

  const decimals = network.nativeAsset.decimals;
  const amount = parseUnits(operation.amount, decimals, "amount");
  const balance = parseUnits(state.balance, decimals, "balance");
  const fee = parseUnits(state.estimatedFee, decimals, "estimatedFee");
  const reserve = parseUnits(state.minimumReserve, decimals, "minimumReserve");
  const maximum = parseUnits(
    policy.maxTransferByNetwork[network.id],
    decimals,
    `maxTransferByNetwork.${network.id}`
  );
  if (amount > maximum) {
    blockers.push(
      `Amount ${operation.amount} ${network.nativeAsset.symbol} exceeds the ${formatUnits(
        maximum,
        decimals
      )} ${network.nativeAsset.symbol} policy limit.`
    );
  } else {
    checks.push("Amount is within the network policy limit.");
  }

  const required = amount + fee + reserve;
  if (required > balance) {
    blockers.push(
      `Balance cannot cover amount, estimated fee, and minimum reserve.`
    );
  } else {
    checks.push("Balance covers amount, estimated fee, and minimum reserve.");
  }

  const observedAt = new Date(state.observedAt).getTime();
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - observedAt) / 1000));
  const futureDated = observedAt - now.getTime() > 60_000;
  const stale = ageSeconds > state.staleAfterSeconds || futureDated;
  if (stale && policy.requireFreshState) {
    blockers.push(
      futureDated
        ? "State snapshot is future-dated."
        : "State snapshot is older than the allowed freshness window."
    );
  } else if (!stale) {
    checks.push("State snapshot is within the freshness window.");
  }

  return {
    operationId: operation.id,
    specialist,
    family,
    network: network.name,
    networkId: network.id,
    action: operation.action,
    asset: network.nativeAsset.symbol,
    amount: operation.amount,
    destination: operation.destination,
    status: blockers.length ? "BLOCKED" : "READY",
    checks,
    blockers,
    snapshotAgeSeconds: ageSeconds,
    readOnlyCalls,
    estimatedFee: state.estimatedFee,
    remainingBalance:
      required <= balance ? formatUnits(balance - amount - fee, decimals) : null,
    transactionCreated: false,
    signatureRequested: false,
  };
}
