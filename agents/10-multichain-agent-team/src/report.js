export function formatTeamReport(result) {
  const lines = [
    "# Multichain Agent Team Report",
    "",
    `Status: ${result.status}`,
    `Execution mode: ${result.executionMode}`,
    `Goal: ${result.goal}`,
    "",
    "## Coordinator",
    "",
    `- Operations dispatched: ${result.findings.length}`,
    `- Specialists consulted: ${new Set(result.findings.map((finding) => finding.specialist)).size}`,
    `- Dependency order: ${result.executionOrder.join(" -> ")}`,
    `- Policy preflight: ${result.preflight.passed ? "PASSED" : "BLOCKED"}`,
    "",
    "## Specialist Findings",
    "",
  ];

  for (const finding of result.findings) {
    lines.push(
      `### ${finding.operationId}: ${finding.specialist}`,
      `- Network: ${finding.network} (${finding.family})`,
      `- Proposed action: ${finding.action}`,
      `- Amount: ${finding.amount} ${finding.asset}`,
      `- Destination: ${finding.destination}`,
      `- Estimated fee: ${finding.estimatedFee} ${finding.asset}`,
      `- Remaining balance after amount and fee: ${finding.remainingBalance ?? "Unavailable"} ${finding.asset}`,
      `- Snapshot age: ${finding.snapshotAgeSeconds} seconds`,
      `- Status: ${finding.status}`,
      `- Read-only checks represented: ${finding.readOnlyCalls.join(", ")}`,
      ...finding.checks.map((check) => `- Check: ${check}`),
      ...finding.blockers.map((blocker) => `- Blocker: ${blocker}`),
      ""
    );
  }

  lines.push(
    "## Consensus",
    "",
    ...(result.blockers.length
      ? result.blockers.map((blocker) => `- ${blocker}`)
      : ["- Every specialist returned READY and policy preflight passed."]),
    "",
    "## Plan Notes",
    "",
    ...(result.notes.length ? result.notes.map((note) => `- ${note}`) : ["- None"]),
    "",
    "## Safety Boundary",
    "",
    "- This team produced a plan only.",
    "- No RPC, Horizon, wallet, signing, bridge, or transaction-submission call was made.",
    "- No private key, seed phrase, signature, or signed transaction was requested.",
    "- Recheck addresses, balances, reserves, fees, and network state before any separate execution workflow.",
    ""
  );
  return lines.join("\n");
}
