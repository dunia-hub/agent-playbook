import { createResearchPlan } from "./plan-research.js";
import { collectEvidence } from "./evidence-collector.js";
import { analyzeEvidence } from "./analyze-evidence.js";
import { assembleSynthesis } from "./deterministic-synthesis.js";
import { renderResearchReport } from "./report-renderer.js";
import { validateFindingCoverage } from "./finding-coverage.js";

export async function runResearchAgent({
  question,
  client,
  model,
  currentDate = new Date().toISOString().slice(0, 10),
  searchImpl,
  readImpl,
  plannerImpl = createResearchPlan,
  collectorImpl = collectEvidence,
  analyzerImpl = analyzeEvidence,
  synthesizerImpl = assembleSynthesis,
  rendererImpl = renderResearchReport,
  onProgress = () => {},
}) {
  if (typeof onProgress !== "function") {
    throw new Error("onProgress must be a function.");
  }

  await onProgress("Creating research plan");

  const plan = await plannerImpl({
    question,
    client,
    model,
    currentDate,
  });

  await onProgress("Searching for relevant sources");

  const collection = await collectorImpl({
    plan,
    ...(searchImpl ? { searchImpl } : {}),
    ...(readImpl ? { readImpl } : {}),
  });

  if (!Array.isArray(collection.sources) || collection.sources.length < 2) {
    const failureCount = Array.isArray(collection.failures)
      ? collection.failures.length
      : 0;

    throw new Error(
      `Research stopped: only ${collection.sources?.length || 0} readable sources were collected (${failureCount} retrieval failures). At least 2 are required.`,
    );
  }

  await onProgress(
    `Analyzing evidence from ${collection.sources.length} sources`,
  );

  const analysis = await analyzerImpl({
    plan,
    sources: collection.sources,
    client,
    model,
    currentDate,
  });

  const coverage = validateFindingCoverage(plan, analysis);

  await onProgress("Synthesizing supported findings");

  const synthesis = await synthesizerImpl({
    plan,
    analysis,
    sources: collection.sources,
    client,
    model,
    currentDate,
    coverage,
  });

  const report = rendererImpl({
    question: plan.question,
    synthesis,
    coverage,
    analysis,
    sources: collection.sources,
  });

  await onProgress("Research report complete");

  return {
    plan,
    sources: collection.sources,
    retrievalFailures: collection.failures,
    analysis,
    synthesis,
    coverage,
    report,
  };
}
