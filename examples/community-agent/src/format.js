export function formatReview(submission, review) {
  return [
    "# Community Agent Review",
    "",
    `Agent: ${submission.name}`,
    `Status: ${review.status}`,
    `Checks passed: ${review.score.passed}/${review.score.total}`,
    "",
    "## Checks",
    "",
    ...review.checks.map((check) => `- ${check.passed ? "PASS" : "FAIL"}: ${check.label}`),
    "",
    "## Recommendations",
    "",
    ...(review.recommendations.length ? review.recommendations.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Human review is still required. This result is not an automated approval.",
  ].join("\n");
}
