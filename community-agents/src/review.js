import { evaluateAgent } from "./rules.js";

export async function reviewAgent(agent) {
  const checks = await evaluateAgent(agent);
  const passed = checks.filter((check) => check.passed).length;
  return {
    agent: agent.slug,
    status: passed === checks.length ? "READY_FOR_HUMAN_REVIEW" : "NEEDS_WORK",
    score: { passed, total: checks.length },
    checks,
    blockers: checks.filter((check) => !check.passed).map((check) => `${check.label}: ${check.detail}`),
    automatedApproval: false,
    codeExecuted: false,
  };
}
