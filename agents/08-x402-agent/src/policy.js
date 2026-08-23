import { findDefaultAsset } from "./assets.js";

function sameValue(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function getAssetIdentity(requirement) {
  const defaultAsset = findDefaultAsset(
    requirement.asset,
    requirement.network,
  );

  return {
    asset: requirement.asset,
    symbol: defaultAsset?.symbol ?? null,
  };
}

export function evaluatePaymentRequirements(requirements, config) {
  return requirements.map((requirement) => {
    const reasons = [];

    if (requirement.scheme !== "exact") {
      reasons.push(`Unsupported payment scheme: ${requirement.scheme}`);
    }

    if (!config.allowedNetworks.includes(requirement.network)) {
      reasons.push(`Network is not allowed: ${requirement.network}`);
    }

    const assetIdentity = getAssetIdentity(requirement);
    const assetAllowed = config.allowedAssets.some(
      (allowedAsset) =>
        sameValue(allowedAsset, assetIdentity.asset) ||
        (assetIdentity.symbol &&
          sameValue(allowedAsset, assetIdentity.symbol)),
    );

    if (!assetAllowed) {
      reasons.push(`Asset is not allowed: ${requirement.asset}`);
    }

    if (
      config.allowedRecipients.length > 0 &&
      !config.allowedRecipients.some((recipient) =>
        sameValue(recipient, requirement.payTo),
      )
    ) {
      reasons.push(`Recipient is not allowed: ${requirement.payTo}`);
    }

    return {
      requirement,
      allowed: reasons.length === 0,
      reasons,
      assetSymbol: assetIdentity.symbol,
    };
  });
}

export function createPaymentPolicy(config) {
  return (_version, requirements) =>
    evaluatePaymentRequirements(requirements, config)
      .filter((result) => result.allowed)
      .map((result) => result.requirement);
}

export function formatPaymentAmount(requirement) {
  const defaultAsset = findDefaultAsset(
    requirement.asset,
    requirement.network,
  );

  if (!defaultAsset || !/^\d+$/.test(requirement.amount)) {
    return `${requirement.amount} ${requirement.asset}`;
  }

  const atomicAmount = BigInt(requirement.amount);
  const scale = 10n ** BigInt(defaultAsset.decimals);
  const whole = atomicAmount / scale;
  const fraction = (atomicAmount % scale)
    .toString()
    .padStart(defaultAsset.decimals, "0")
    .replace(/0+$/, "");

  const displayAmount = fraction
    ? `${whole}.${fraction}`
    : whole.toString();

  return `${displayAmount} ${defaultAsset.symbol}`;
}
