import { buildEvidenceCatalog } from "./evidence-catalog.js";

function confidenceFor(record) {
  if (/\d|%/.test(record.claim)) {
    return "medium";
  }

  if (
    record.support === "direct" &&
    record.sourceQuality === "strong" &&
    record.sourceRelevance === "high"
  ) {
    return "high";
  }

  if (
    record.support === "partial" ||
    record.sourceQuality === "weak" ||
    record.sourceRelevance === "low"
  ) {
    return "low";
  }

  return "medium";
}

function selectBalancedEvidence(evidence, tasks, limit = 6) {
  const byTask = new Map(tasks.map((task) => [task.id, []]));

  for (const record of evidence) {
    for (const taskId of record.taskIds) {
      byTask.get(taskId)?.push(record);
    }
  }

  const selected = [];
  const seenEvidenceIds = new Set();
  let round = 0;

  while (selected.length < limit) {
    let added = false;

    for (const records of byTask.values()) {
      const record = records[round];

      if (record && !seenEvidenceIds.has(record.evidenceId)) {
        selected.push(record);
        seenEvidenceIds.add(record.evidenceId);
        added = true;
      }

      if (selected.length === limit) {
        break;
      }
    }

    if (!added) {
      break;
    }

    round += 1;
  }

  return selected;
}

function asSentence(value) {
  const claim = value.trim();
  return /[.!?]$/.test(claim) ? claim : `${claim}.`;
}

export function assembleSynthesis({ plan, analysis, coverage }) {
  if (!Array.isArray(plan?.tasks) || plan.tasks.length === 0) {
    throw new Error("A research plan with tasks is required for synthesis.");
  }

  const evidence = buildEvidenceCatalog(analysis);
  const selected = selectBalancedEvidence(evidence, plan.tasks);
  const answerSections = plan.tasks.map((task) => {
    const answer = selected
      .filter((record) => record.taskIds.includes(task.id))
      .map((record) => asSentence(record.claim))
      .join(" ");

    return {
      taskId: task.id,
      heading: task.question,
      status: answer ? "supported" : "insufficient evidence",
      answer:
        answer ||
        "Insufficient verified evidence was retrieved for this part of the question.",
    };
  });
  const complete = coverage
    ? coverage.complete
    : answerSections.every((section) => section.status === "supported");
  const coverageGaps = answerSections
    .filter((section) => section.status === "insufficient evidence")
    .map(
      (section) =>
        `Insufficient verified evidence for ${section.taskId}: ${section.heading}`,
    );

  return {
    status: complete ? "complete" : "partial",
    answer: answerSections.map((section) => section.answer).join(" "),
    answerSections,
    keyFindings: selected.map((record) => ({
      finding: record.claim,
      evidenceIds: [record.evidenceId],
      sourceIds: [record.sourceId],
      taskIds: [...record.taskIds],
      confidence: confidenceFor(record),
    })),
    conflictsAndUncertainty: analysis.conflicts.map(
      (conflict) => conflict.description,
    ),
    evidenceGaps: [...new Set([...analysis.gaps, ...coverageGaps])],
  };
}
