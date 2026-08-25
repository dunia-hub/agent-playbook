const MAX_SOURCES_FOR_ANALYSIS = 4;
const MAX_CONTENT_PER_SOURCE = 1800;

function prepareSources(sources) {
  if (!Array.isArray(sources) || sources.length < 2) {
    throw new Error(
      "At least 2 readable sources are required for evidence analysis.",
    );
  }

  return sources.slice(0, MAX_SOURCES_FOR_ANALYSIS).map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    domain: source.domain,
    description: source.description || "",
    publishedAt: source.publishedAt || null,
    taskIds: source.taskIds,
    content: source.content.slice(0, MAX_CONTENT_PER_SOURCE),
  }));
}

export function buildEvidencePrompt({
  plan,
  sources,
  currentDate = new Date().toISOString().slice(0, 10),
}) {
  if (!plan?.question || !Array.isArray(plan.tasks)) {
    throw new Error("A valid research plan is required.");
  }

  const preparedSources = prepareSources(sources);

  return `You are the evidence-analysis stage of a source-grounded research agent.

Current date: ${currentDate}
Research question: ${plan.question}

Research tasks:
${JSON.stringify(plan.tasks, null, 2)}

Source material:
${JSON.stringify(preparedSources, null, 2)}

Analyze only the supplied source material. Do not use prior knowledge to add
facts. Do not produce the final research answer yet.

Return valid JSON only using this exact structure:
{
  "sourceAssessments": [
    {
      "sourceId": "S1",
      "sourceType": "government, academic, official documentation, company, journalism, nonprofit, reference, blog, or other",
      "relevance": "high, medium, or low",
      "quality": "strong, mixed, or weak",
      "qualityReasons": [
        "a specific reason based on authorship, evidence, methods, date, or proximity to the claim"
      ],
      "findings": [
        {
          "claim": "a concise claim directly supported by this source",
          "support": "direct or partial",
          "taskIds": ["T1"],
          "excerpt": "a supporting excerpt of no more than 20 words"
        }
      ],
      "limitations": [
        "a limitation affecting how this source should be used"
      ]
    }
  ],
  "conflicts": [
    {
      "topic": "the disputed topic",
      "sourceIds": ["S1", "S2"],
      "description": "how the sources differ without deciding beyond the evidence"
    }
  ],
  "gaps": [
    "an unanswered research task or claim that still lacks enough evidence"
  ]
}

Rules:
1. Include every supplied source exactly once and preserve its source ID.
2. Judge source quality from observable evidence, not domain reputation alone.
3. A relevant source is not automatically a strong source.
4. Mark support as direct only when the supplied text clearly establishes the claim.
5. Mark incomplete, indirect, or qualified evidence as partial.
6. Do not create a finding when the source does not support one.
7. Keep every excerpt at 20 words or fewer and copy it from the supplied content.
8. Give each finding only the task IDs that the finding itself answers.
9. Use only task IDs connected to that source in the supplied source material.
10. Record disagreements in conflicts instead of silently choosing one version.
11. Record every research task without a supported finding in gaps.
12. Do not invent authors, dates, methods, statistics, claims, or source types.
13. Do not include Markdown or text outside the JSON object.`;
}
