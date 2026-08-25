function escapeMarkdown(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/([[\]*_<>#`])/g, "\\$1");
}

function renderList(items, emptyMessage) {
  if (items.length === 0) {
    return `- ${emptyMessage}`;
  }

  return items
    .map((item) => `- ${escapeMarkdown(item)}`)
    .join("\n");
}

export function renderResearchReport({
  question,
  synthesis,
  analysis,
  sources,
}) {
  if (typeof question !== "string" || question.trim() === "") {
    throw new Error("A research question is required.");
  }

  if (!synthesis?.answer || !Array.isArray(synthesis.keyFindings)) {
    throw new Error("A valid synthesis is required.");
  }

  if (!Array.isArray(analysis?.sourceAssessments)) {
    throw new Error("A valid evidence analysis is required.");
  }

  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("At least one source is required.");
  }

  const assessmentBySourceId = new Map(
    analysis.sourceAssessments.map((assessment) => [
      assessment.sourceId,
      assessment,
    ]),
  );

  const keyFindings = synthesis.keyFindings
    .map((finding) => {
      const citations = finding.sourceIds
        .map((sourceId) => `[${sourceId}]`)
        .join(" ");

      return `- ${escapeMarkdown(finding.finding)} ${citations} — Confidence: ${finding.confidence}`;
    })
    .join("\n");

  const answer = Array.isArray(synthesis.answerSections)
    ? synthesis.answerSections
        .map(
          (section) =>
            `### ${escapeMarkdown(section.heading)}\n\n${escapeMarkdown(section.answer)}`,
        )
        .join("\n\n")
    : escapeMarkdown(synthesis.answer);

  const sourceAssessments = sources
    .slice(0, 5)
    .map((source) => {
      const assessment = assessmentBySourceId.get(source.id);

      if (!assessment) {
        throw new Error(
          `Missing evidence assessment for source ${source.id}.`,
        );
      }

      const reasons = assessment.qualityReasons
        .map((reason) => escapeMarkdown(reason))
        .join(" ");

      return `- [${source.id}] ${escapeMarkdown(source.title)} — ${assessment.sourceType}; ${assessment.quality} quality; ${assessment.relevance} relevance. ${reasons}`;
    })
    .join("\n");

  const sourceDirectory = sources
    .slice(0, 5)
    .map((source) => {
      const date = source.publishedAt
        ? ` — ${escapeMarkdown(source.publishedAt)}`
        : "";

      return `- [${source.id}] [${escapeMarkdown(source.title)}](<${source.url}>)${date}`;
    })
    .join("\n");

  return `# Research Report

## Research Question

${escapeMarkdown(question.trim())}

## Research Status

${synthesis.status === "partial" ? "Partial — one or more planned tasks lacked verified evidence." : "Complete — every planned task has verified evidence."}

## Answer

${answer}

## Key Findings

${keyFindings}

## Conflicts and Uncertainty

${renderList(
  synthesis.conflictsAndUncertainty,
  "No material conflicts were identified in the collected evidence.",
)}

## Evidence Gaps

${renderList(
  synthesis.evidenceGaps,
  "No material evidence gaps were recorded.",
)}

## Source Assessment

${sourceAssessments}

## Sources

${sourceDirectory}

> This report is limited to the sources successfully retrieved and analyzed. Important findings should be checked against the original sources before use.`;
}
