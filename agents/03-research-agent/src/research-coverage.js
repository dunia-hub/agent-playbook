export function validateResearchCoverage(plan, sources) {
  if (!Array.isArray(plan?.tasks) || plan.tasks.length === 0) {
    throw new Error("A research plan with tasks is required for coverage validation.");
  }

  if (!Array.isArray(sources)) {
    throw new Error("Collected sources are required for coverage validation.");
  }

  const coveredTaskIds = new Set(
    sources.flatMap((source) => source.taskIds || []),
  );
  const requiredCoverage = Math.min(
    plan.tasks.length,
    Math.max(2, Math.ceil(plan.tasks.length * 0.6)),
  );
  const coveredTasks = plan.tasks.filter((task) =>
    coveredTaskIds.has(task.id),
  );

  if (coveredTasks.length < requiredCoverage) {
    const missing = plan.tasks
      .filter((task) => !coveredTaskIds.has(task.id))
      .map((task) => `${task.id}: ${task.question}`)
      .join("; ");

    throw new Error(
      `Research stopped: readable sources covered only ${coveredTasks.length} of ${plan.tasks.length} planned tasks. Missing coverage: ${missing}`,
    );
  }

  return {
    coveredTaskIds: coveredTasks.map((task) => task.id),
    requiredCoverage,
  };
}
