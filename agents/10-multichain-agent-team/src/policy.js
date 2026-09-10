export function preflightPolicy({ plan, registry, policy }) {
  const blockers = [];
  if (plan.executionMode !== "plan_only") blockers.push("Execution mode is not plan_only.");
  if (policy.testnetOnly) {
    const networks = new Map(registry.networks.map((network) => [network.id, network]));
    for (const operation of plan.operations) {
      if (!networks.get(operation.network)?.testnet) {
        blockers.push(`${operation.id} targets a non-testnet network.`);
      }
    }
  }
  return { passed: blockers.length === 0, blockers };
}
