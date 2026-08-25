export function validateFindingCoverage(plan, analysis) {
  if (!Array.isArray(plan?.tasks) || plan.tasks.length === 0) {
    throw new Error("A research plan with tasks is required for finding coverage.");
  }

  if (!Array.isArray(analysis?.sourceAssessments)) {
    throw new Error("A valid evidence analysis is required for finding coverage.");
  }

  const coveredTaskIds = new Set(
    analysis.sourceAssessments.flatMap((assessment) =>
      assessment.findings.flatMap((finding) => finding.taskIds || []),
    ),
  );
  const missingTasks = plan.tasks.filter(
    (task) => !coveredTaskIds.has(task.id),
  );

  return {
    complete: missingTasks.length === 0,
    coveredTaskIds: plan.tasks
      .filter((task) => coveredTaskIds.has(task.id))
      .map((task) => task.id),
    missingTasks: missingTasks.map((task) => ({
      id: task.id,
      question: task.question,
    })),
  };
}
