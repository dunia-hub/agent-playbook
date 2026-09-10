import { parseUnsignedInteger } from "./units.js";

const FEE_MODELS = new Set(["eip1559", "legacy"]);
const SOURCES = new Set(["snapshot", "rpc"]);

function optionalPositiveNumber(value, label) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number or null.`);
  }
  return value;
}

function validateCommonNetwork(network, index) {
  const label = `networks[${index}]`;
  if (!network || typeof network !== "object" || Array.isArray(network)) {
    throw new Error(`${label} must be an object.`);
  }
  if (typeof network.name !== "string" || !network.name.trim()) {
    throw new Error(`${label}.name is required.`);
  }
  if (!Number.isInteger(network.chainId) || network.chainId < 1) {
    throw new Error(`${label}.chainId must be a positive integer.`);
  }
  if (typeof network.currencySymbol !== "string" || !network.currencySymbol.trim()) {
    throw new Error(`${label}.currencySymbol is required.`);
  }
  if (!SOURCES.has(network.source)) {
    throw new Error(`${label}.source must be snapshot or rpc.`);
  }

  const staleAfterSeconds = network.staleAfterSeconds ?? 300;
  if (!Number.isInteger(staleAfterSeconds) || staleAfterSeconds < 1) {
    throw new Error(`${label}.staleAfterSeconds must be a positive integer.`);
  }

  return {
    ...network,
    name: network.name.trim(),
    currencySymbol: network.currencySymbol.trim().toUpperCase(),
    nativeTokenPriceUsd: optionalPositiveNumber(
      network.nativeTokenPriceUsd,
      `${label}.nativeTokenPriceUsd`
    ),
    staleAfterSeconds,
  };
}

function validateSnapshot(network, label) {
  if (!FEE_MODELS.has(network.feeModel)) {
    throw new Error(`${label}.feeModel must be eip1559 or legacy.`);
  }
  const observedAt = new Date(network.observedAt);
  if (typeof network.observedAt !== "string" || Number.isNaN(observedAt.getTime())) {
    throw new Error(`${label}.observedAt must be a valid ISO timestamp.`);
  }

  if (network.feeModel === "eip1559") {
    parseUnsignedInteger(network.baseFeePerGasWei, `${label}.baseFeePerGasWei`);
    parseUnsignedInteger(
      network.priorityFeePerGasWei,
      `${label}.priorityFeePerGasWei`
    );
  } else {
    parseUnsignedInteger(network.gasPriceWei, `${label}.gasPriceWei`);
  }
  if (network.l1DataFeeWei !== undefined) {
    parseUnsignedInteger(network.l1DataFeeWei, `${label}.l1DataFeeWei`);
  }
}

export function validateNetworks(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.networks)) {
    throw new Error("Network file must contain a networks array.");
  }
  if (data.networks.length === 0) {
    throw new Error("At least one network is required.");
  }

  const chainIds = new Set();
  const networks = data.networks.map((rawNetwork, index) => {
    const network = validateCommonNetwork(rawNetwork, index);
    const label = `networks[${index}]`;
    if (chainIds.has(network.chainId)) {
      throw new Error(`Duplicate chainId: ${network.chainId}.`);
    }
    chainIds.add(network.chainId);

    if (network.source === "snapshot") {
      validateSnapshot(network, label);
    } else if (
      typeof network.rpcEnv !== "string" ||
      !/^[A-Z][A-Z0-9_]*$/.test(network.rpcEnv)
    ) {
      throw new Error(`${label}.rpcEnv must name an uppercase environment variable.`);
    }
    return network;
  });

  return { networks };
}

export function validateTransaction(transaction) {
  if (!transaction || typeof transaction !== "object" || Array.isArray(transaction)) {
    throw new Error("Transaction profile must be a JSON object.");
  }
  if (typeof transaction.name !== "string" || !transaction.name.trim()) {
    throw new Error("Transaction name is required.");
  }
  const gasLimit = parseUnsignedInteger(transaction.gasLimit, "gasLimit");
  if (gasLimit < 21_000n || gasLimit > 30_000_000n) {
    throw new Error("gasLimit must be between 21000 and 30000000.");
  }
  const baseFeeMultiplier = transaction.baseFeeMultiplier ?? 2;
  if (
    typeof baseFeeMultiplier !== "number" ||
    !Number.isFinite(baseFeeMultiplier) ||
    baseFeeMultiplier < 1 ||
    baseFeeMultiplier > 5
  ) {
    throw new Error("baseFeeMultiplier must be between 1 and 5.");
  }

  return {
    name: transaction.name.trim(),
    gasLimit: gasLimit.toString(),
    baseFeeMultiplier,
    budgetUsd: optionalPositiveNumber(transaction.budgetUsd, "budgetUsd"),
    maxFeeGwei: optionalPositiveNumber(transaction.maxFeeGwei, "maxFeeGwei"),
  };
}
