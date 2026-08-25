export function buildEvidenceCatalog(analysis) {
  if (!Array.isArray(analysis?.sourceAssessments)) {
    throw new Error("A valid evidence analysis is required.");
  }

  const evidence = [];

  for (const assessment of analysis.sourceAssessments) {
    for (const finding of assessment.findings) {
      evidence.push({
        evidenceId: `E${evidence.length + 1}`,
        sourceId: assessment.sourceId,
        claim: finding.claim,
        support: finding.support,
        taskIds: [...finding.taskIds],
        sourceQuality: assessment.quality,
        sourceRelevance: assessment.relevance,
      });
    }
  }

  if (evidence.length === 0) {
    throw new Error(
      "At least one supported evidence finding is required for synthesis.",
    );
  }

  return evidence;
}
