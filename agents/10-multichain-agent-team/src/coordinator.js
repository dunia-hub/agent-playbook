import { topologicalOrder } from "./graph.js";
import { preflightPolicy } from "./policy.js";
import { runEvmSpecialist } from "./specialists/evm.js";
import { runSolanaSpecialist } from "./specialists/solana.js";
import { runStellarSpecialist } from "./specialists/stellar.js";

const SPECIALISTS = {
  evm: runEvmSpecialist,
  solana: runSolanaSpecialist,
  stellar: runStellarSpecialist,
};

export async function runAgentTeam({ plan, registry, state, policy, now = new Date() }) {
  const preflight = preflightPolicy({ plan, registry, policy });
  const executionOrder = topologicalOrder(plan.operations);
  const networks = new Map(registry.networks.map((network) => [network.id, network]));

  const initialFindings = await Promise.all(
    plan.operations.map(async (operation) => {
      const network = networks.get(operation.network);
      const specialist = SPECIALISTS[network.family];
      return specialist({
        operation,
        network,
        state: state.networks[network.id],
        policy,
        now,
      });
    })
  );

  const findingsById = new Map(initialFindings.map((finding) => [finding.operationId, finding]));
  for (const operationId of executionOrder) {
    const operation = plan.operations.find((candidate) => candidate.id === operationId);
    const finding = findingsById.get(operationId);
    const blockedDependencies = operation.dependsOn.filter(
      (dependency) => findingsById.get(dependency)?.status !== "READY"
    );
    if (blockedDependencies.length) {
      finding.blockers.push(
        `Blocked by dependency: ${blockedDependencies.join(", ")}.`
      );
      finding.status = "BLOCKED";
    }
  }

  const findings = plan.operations.map((operation) => findingsById.get(operation.id));
  const blockers = [
    ...preflight.blockers,
    ...findings.flatMap((finding) =>
      finding.blockers.map((blocker) => `${finding.operationId}: ${blocker}`)
    ),
  ];
  const status = blockers.length ? "TEAM_BLOCKED" : "TEAM_READY";

  return {
    generatedAt: now.toISOString(),
    goal: plan.goal,
    executionMode: plan.executionMode,
    status,
    preflight,
    executionOrder,
    findings,
    blockers,
    notes: plan.notes,
    executionAuthorized: false,
    signatures: [],
    transactions: [],
  };
}
