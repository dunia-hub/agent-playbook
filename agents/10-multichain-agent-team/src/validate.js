import { parseUnits } from "./units.js";

const FAMILIES = new Set(["evm", "solana", "stellar"]);
const PLAN_KEYS = ["goal", "executionMode", "operations", "notes"];
const OPERATION_KEYS = ["id", "network", "action", "destination", "amount", "dependsOn"];

export function validateRegistry(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.networks)) {
    throw new Error("Registry must contain a networks array.");
  }
  if (data.networks.length === 0) throw new Error("Registry is empty.");
  const ids = new Set();
  const networks = data.networks.map((network, index) => {
    const label = `networks[${index}]`;
    if (!network || typeof network !== "object") throw new Error(`${label} must be an object.`);
    for (const field of ["id", "name", "family"]) {
      if (typeof network[field] !== "string" || !network[field].trim()) {
        throw new Error(`${label}.${field} is required.`);
      }
    }
    if (!FAMILIES.has(network.family)) throw new Error(`${label}.family is unsupported.`);
    if (typeof network.testnet !== "boolean") throw new Error(`${label}.testnet must be boolean.`);
    if (
      !network.nativeAsset ||
      typeof network.nativeAsset.symbol !== "string" ||
      !Number.isInteger(network.nativeAsset.decimals) ||
      network.nativeAsset.decimals < 0 ||
      network.nativeAsset.decimals > 30
    ) {
      throw new Error(`${label}.nativeAsset is invalid.`);
    }
    if (ids.has(network.id)) throw new Error(`Duplicate network id: ${network.id}.`);
    ids.add(network.id);
    return network;
  });
  return { networks };
}

export function validateState(data, registry) {
  if (!data || typeof data !== "object" || !data.networks || typeof data.networks !== "object") {
    throw new Error("State file must contain a networks object.");
  }
  const states = {};
  for (const network of registry.networks) {
    const state = data.networks[network.id];
    if (!state) throw new Error(`Missing state for ${network.id}.`);
    for (const field of ["balance", "estimatedFee", "minimumReserve"]) {
      parseUnits(state[field], network.nativeAsset.decimals, `${network.id}.${field}`);
    }
    const observedAt = new Date(state.observedAt);
    if (typeof state.observedAt !== "string" || Number.isNaN(observedAt.getTime())) {
      throw new Error(`${network.id}.observedAt is invalid.`);
    }
    if (!Number.isInteger(state.staleAfterSeconds) || state.staleAfterSeconds < 1) {
      throw new Error(`${network.id}.staleAfterSeconds must be a positive integer.`);
    }
    states[network.id] = state;
  }
  return { networks: states };
}

export function validatePolicy(policy, registry) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("Policy must be a JSON object.");
  }
  if (typeof policy.testnetOnly !== "boolean" || typeof policy.requireFreshState !== "boolean") {
    throw new Error("Policy testnetOnly and requireFreshState must be boolean.");
  }
  if (!Number.isInteger(policy.maxOperations) || policy.maxOperations < 1 || policy.maxOperations > 20) {
    throw new Error("Policy maxOperations must be an integer from 1 to 20.");
  }
  if (!Array.isArray(policy.allowedActions) || policy.allowedActions.length === 0) {
    throw new Error("Policy allowedActions must not be empty.");
  }
  if (!policy.maxTransferByNetwork || typeof policy.maxTransferByNetwork !== "object") {
    throw new Error("Policy maxTransferByNetwork is required.");
  }
  for (const network of registry.networks) {
    const maximum = parseUnits(
      policy.maxTransferByNetwork[network.id],
      network.nativeAsset.decimals,
      `maxTransferByNetwork.${network.id}`
    );
    if (maximum === 0n) {
      throw new Error(`maxTransferByNetwork.${network.id} must be greater than zero.`);
    }
  }
  return policy;
}

export function validatePlan(plan, registry, policy) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new Error("Plan must be a JSON object.");
  }
  const missing = PLAN_KEYS.filter((key) => !(key in plan));
  const extra = Object.keys(plan).filter((key) => !PLAN_KEYS.includes(key));
  if (missing.length) throw new Error(`Plan is missing: ${missing.join(", ")}.`);
  if (extra.length) throw new Error(`Plan has unsupported keys: ${extra.join(", ")}.`);
  if (typeof plan.goal !== "string" || !plan.goal.trim()) throw new Error("Plan goal is required.");
  if (plan.executionMode !== "plan_only") {
    throw new Error("executionMode must be plan_only.");
  }
  if (!Array.isArray(plan.operations) || plan.operations.length === 0) {
    throw new Error("Plan must contain at least one operation.");
  }
  if (plan.operations.length > policy.maxOperations) {
    throw new Error(`Plan exceeds the ${policy.maxOperations}-operation policy limit.`);
  }
  if (!Array.isArray(plan.notes) || plan.notes.some((note) => typeof note !== "string")) {
    throw new Error("Plan notes must be an array of strings.");
  }

  const networks = new Map(registry.networks.map((network) => [network.id, network]));
  const ids = new Set();
  const operations = plan.operations.map((operation, index) => {
    const label = `operations[${index}]`;
    if (!operation || typeof operation !== "object") throw new Error(`${label} must be an object.`);
    const opMissing = OPERATION_KEYS.filter((key) => !(key in operation));
    const opExtra = Object.keys(operation).filter((key) => !OPERATION_KEYS.includes(key));
    if (opMissing.length) throw new Error(`${label} is missing: ${opMissing.join(", ")}.`);
    if (opExtra.length) throw new Error(`${label} has unsupported keys: ${opExtra.join(", ")}.`);
    if (typeof operation.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(operation.id)) {
      throw new Error(`${label}.id must be a lowercase slug.`);
    }
    if (ids.has(operation.id)) throw new Error(`Duplicate operation id: ${operation.id}.`);
    ids.add(operation.id);
    const network = networks.get(operation.network);
    if (!network) throw new Error(`${label} uses unknown network ${operation.network}.`);
    if (!policy.allowedActions.includes(operation.action)) {
      throw new Error(`${label} action ${operation.action} is not allowed.`);
    }
    if (typeof operation.destination !== "string" || !operation.destination) {
      throw new Error(`${label}.destination is required.`);
    }
    if (parseUnits(operation.amount, network.nativeAsset.decimals, `${label}.amount`) === 0n) {
      throw new Error(`${label}.amount must be greater than zero.`);
    }
    if (!Array.isArray(operation.dependsOn) || operation.dependsOn.some((id) => typeof id !== "string")) {
      throw new Error(`${label}.dependsOn must be an array of operation IDs.`);
    }
    return operation;
  });

  for (const operation of operations) {
    for (const dependency of operation.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`${operation.id} depends on unknown operation ${dependency}.`);
      if (dependency === operation.id) throw new Error(`${operation.id} cannot depend on itself.`);
    }
  }
  return { ...plan, goal: plan.goal.trim(), operations };
}
