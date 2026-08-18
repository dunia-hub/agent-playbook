export function checkQuoteSafety(quote) {
  const priceImpact = Number(quote.priceImpactPercent);

  if (!Number.isFinite(priceImpact)) {
    throw new Error("Quote returned an invalid price impact.");
  }

  if (priceImpact > 5) {
    throw new Error(
      `Swap blocked: price impact is ${priceImpact}%, above the 5% workshop safety limit.`
    );
  }

  return quote;
}
