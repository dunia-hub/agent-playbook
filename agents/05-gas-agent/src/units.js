export const WEI_PER_GWEI = 1_000_000_000n;
export const WEI_PER_NATIVE = 1_000_000_000_000_000_000n;

export function parseUnsignedInteger(value, label) {
  if (typeof value === "bigint") {
    if (value < 0n) throw new Error(`${label} must be an unsigned integer.`);
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error(`${label} must be an unsigned integer string.`);
  }
  return BigInt(value);
}

export function formatUnits(value, decimals, maximumFractionDigits = decimals) {
  const amount = typeof value === "bigint" ? value : BigInt(value);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, "0");
  const visible = fraction.slice(0, maximumFractionDigits).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${visible ? `.${visible}` : ""}`;
}

export function formatGwei(wei) {
  return formatUnits(wei, 9, 6);
}

export function formatNative(wei) {
  return formatUnits(wei, 18, 10);
}

export function calculateUsd(wei, nativeTokenPriceUsd) {
  if (nativeTokenPriceUsd === null || nativeTokenPriceUsd === undefined) return null;
  return Number(formatUnits(wei, 18, 15)) * nativeTokenPriceUsd;
}
