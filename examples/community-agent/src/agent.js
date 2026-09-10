const checks = [
  {
    id: "name",
    label: "Clear name",
    test: (item) => item.name.trim().length >= 3,
    recommendation: "Use a clear agent name with at least three characters.",
  },
  {
    id: "slug",
    label: "Valid folder slug",
    test: (item) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug),
    recommendation: "Use a lowercase, hyphenated folder slug.",
  },
  {
    id: "purpose",
    label: "Specific purpose",
    test: (item) => item.purpose.trim().length >= 30,
    recommendation: "Explain the problem and expected result in at least 30 characters.",
  },
  {
    id: "run-command",
    label: "Run command",
    test: (item) => item.runCommand.trim().length > 0,
    recommendation: "Document one command that runs the agent.",
  },
  {
    id: "test-command",
    label: "Test command",
    test: (item) => item.testCommand.trim().length > 0,
    recommendation: "Document one command that runs the tests.",
  },
  {
    id: "safety",
    label: "Safety rules",
    test: (item) => item.safety.some((rule) => rule.trim().length >= 15),
    recommendation: "Add at least one concrete safety rule.",
  },
  {
    id: "services",
    label: "External services disclosed",
    test: (item) => item.externalServices.every((service) => service.trim().length > 0),
    recommendation: "Name each external service or use an empty array when none are required.",
  },
];

export function reviewSubmission(submission) {
  const results = checks.map((check) => {
    const passed = check.test(submission);
    return {
      id: check.id,
      label: check.label,
      passed,
      recommendation: passed ? null : check.recommendation,
    };
  });
  const passed = results.filter((result) => result.passed).length;
  return {
    status: passed === results.length ? "READY_FOR_HUMAN_REVIEW" : "NEEDS_WORK",
    score: { passed, total: results.length },
    checks: results,
    recommendations: results.filter((result) => !result.passed).map((result) => result.recommendation),
    automatedApproval: false,
  };
}
