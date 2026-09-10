function usd(value) {
  return value === null ? "Not supplied" : `$${value.toFixed(6)}`;
}

export function formatFeeReport(report) {
  const { transaction, estimates } = report;
  const sections = [
    "# Gas Agent Report",
    "",
    `Transaction: ${transaction.name}`,
    `Gas limit: ${transaction.gasLimit}`,
    `USD budget: ${transaction.budgetUsd === null ? "Not set" : `$${transaction.budgetUsd.toFixed(2)}`}`,
    `Maximum fee limit: ${transaction.maxFeeGwei === null ? "Not set" : `${transaction.maxFeeGwei} gwei`}`,
    "",
    "## Network Estimates",
    "",
  ];

  for (const estimate of estimates) {
    sections.push(
      `### ${estimate.network} (chain ${estimate.chainId})`,
      `- Source: ${estimate.source}`,
      `- Fee model: ${estimate.feeModel}`,
      `- Expected fee: ${estimate.expectedFeeGwei} gwei`,
      `- Conservative maximum fee: ${estimate.maximumFeeGwei} gwei`,
      `- Expected cost: ${estimate.expectedCostNative} ${estimate.currencySymbol} (${usd(
        estimate.expectedCostUsd
      )})`,
      `- Conservative maximum cost: ${estimate.maximumCostNative} ${estimate.currencySymbol} (${usd(
        estimate.maximumCostUsd
      )})`,
      `- Snapshot age: ${estimate.ageSeconds} seconds`,
      `- Status: ${estimate.status}`,
      ""
    );
  }

  sections.push(
    "## Best Fit",
    "",
    report.bestFit
      ? `${report.bestFit} is the lowest-cost network currently marked READY.`
      : "No network is currently marked READY.",
    "",
    "## Risk Flags",
    ""
  );

  const flags = estimates.flatMap((estimate) => {
    const items = estimate.blockers.map((blocker) => `${estimate.network}: ${blocker}`);
    if (estimate.stale) {
      items.push(
        estimate.futureDated
          ? `${estimate.network}: snapshot timestamp is later than the report time.`
          : `${estimate.network}: fee data is older than its configured freshness limit.`
      );
    }
    if (estimate.expectedCostUsd === null) {
      items.push(`${estimate.network}: no manually supplied token price; USD cost is unavailable.`);
    }
    return items;
  });
  sections.push(...(flags.length ? flags.map((flag) => `- ${flag}`) : ["- None detected."]));

  sections.push(
    "",
    "## Next Action",
    "",
    report.bestFit
      ? `Recheck ${report.bestFit} immediately before signing. This agent has not signed or sent a transaction.`
      : "Refresh the fee data or adjust the user-defined limits before considering a transaction.",
    ""
  );

  return sections.join("\n");
}
