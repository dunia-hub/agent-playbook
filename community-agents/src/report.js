export function formatReview(review) {
  return [
    "# Community Agent Validation",
    "",
    `Agent: ${review.agent}`,
    `Status: ${review.status}`,
    `Checks passed: ${review.score.passed}/${review.score.total}`,
    "",
    "## Checks",
    "",
    ...review.checks.map((check) => `- ${check.passed ? "PASS" : "FAIL"}: ${check.label} — ${check.detail}`),
    "",
    "## Blockers",
    "",
    ...(review.blockers.length ? review.blockers.map((blocker) => `- ${blocker}`) : ["- None"]),
    "",
    "## Review Boundary",
    "",
    "- No submitted code was executed.",
    "- No files were modified.",
    "- Human maintainer review is still required.",
  ].join("\n");
}
