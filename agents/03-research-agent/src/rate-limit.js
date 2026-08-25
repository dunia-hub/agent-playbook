const RETRY_BUFFER_MS = 750;
const FALLBACK_DELAY_MS = 3000;

export function getRateLimitDelayMs(error) {
  const message = String(error?.message || error || "");
  const isRateLimit =
    error?.status === 429 ||
    error?.code === "rate_limit_exceeded" ||
    /rate limit|rate_limit_exceeded/i.test(message);

  if (!isRateLimit) {
    return null;
  }

  const match = message.match(
    /try again in\s+([\d.]+)\s*(ms|s)/i,
  );

  if (!match) {
    return FALLBACK_DELAY_MS;
  }

  const value = Number(match[1]);
  const milliseconds =
    match[2].toLowerCase() === "s" ? value * 1000 : value;

  return Math.ceil(milliseconds + RETRY_BUFFER_MS);
}

export async function waitForRateLimit(error) {
  const delayMs = getRateLimitDelayMs(error);

  if (delayMs === null) {
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return true;
}
