import test from "node:test";
import assert from "node:assert/strict";

import { renderResearchReport } from "../src/report-renderer.js";

function createInput() {
  return {
    question: "How do research agents verify claims?",
    synthesis: {
      status: "complete",
      answer:
        "Research agents compare claims with retrieved evidence and preserve source links.",
      keyFindings: [
        {
          finding:
            "Research agents compare claims with retrieved evidence.",
          evidenceIds: ["E1"],
          sourceIds: ["S1"],
          confidence: "high",
        },
        {
          finding:
            "Important findings should preserve source citations.",
          evidenceIds: ["E2"],
          sourceIds: ["S2"],
          confidence: "medium",
        },
      ],
      conflictsAndUncertainty: [
        "The sources emphasize different verification stages.",
      ],
      evidenceGaps: [
        "The collected evidence does not quantify accuracy.",
      ],
    },
    analysis: {
      sourceAssessments: [
        {
          sourceId: "S1",
          sourceType: "academic",
          quality: "strong",
          relevance: "high",
          qualityReasons: [
            "The source directly describes verification.",
          ],
        },
        {
          sourceId: "S2",
          sourceType: "official documentation",
          quality: "mixed",
          relevance: "high",
          qualityReasons: [
            "The source directly describes citation handling.",
          ],
        },
      ],
    },
    sources: [
      {
        id: "S1",
        title: "Verification Study",
        url: "https://example.com/study",
        publishedAt: "2026-08-01",
      },
      {
        id: "S2",
        title: "Citation Documentation",
        url: "https://docs.example.com/research",
        publishedAt: null,
      },
    ],
  };
}

test("renders all report sections in the required order", () => {
  const report = renderResearchReport(createInput());

  const sections = [
    "## Research Question",
    "## Research Status",
    "## Answer",
    "## Key Findings",
    "## Conflicts and Uncertainty",
    "## Evidence Gaps",
    "## Source Assessment",
    "## Sources",
  ];

  let previousIndex = -1;

  for (const section of sections) {
    const currentIndex = report.indexOf(section);

    assert.ok(currentIndex > previousIndex);
    previousIndex = currentIndex;
  }
});

test("labels an incomplete report as partial", () => {
  const input = createInput();
  input.synthesis.status = "partial";

  const report = renderResearchReport(input);

  assert.match(report, /Partial — one or more planned tasks lacked verified evidence/);
});

test("adds verified citation markers to key findings", () => {
  const report = renderResearchReport(createInput());

  assert.match(
    report,
    /Research agents compare claims with retrieved evidence\. \[S1\] — Confidence: high/,
  );
  assert.match(
    report,
    /Important findings should preserve source citations\. \[S2\] — Confidence: medium/,
  );
});

test("renders source URLs only from the source directory", () => {
  const report = renderResearchReport(createInput());

  assert.match(
    report,
    /\[Verification Study\]\(<https:\/\/example\.com\/study>\)/,
  );
  assert.match(
    report,
    /\[Citation Documentation\]\(<https:\/\/docs\.example\.com\/research>\)/,
  );
});

test("renders source-quality assessments", () => {
  const report = renderResearchReport(createInput());

  assert.match(
    report,
    /\[S1\] Verification Study — academic; strong quality; high relevance/,
  );
  assert.match(
    report,
    /The source directly describes verification/,
  );
});

test("renders clear empty states for conflicts and gaps", () => {
  const input = createInput();
  input.synthesis.conflictsAndUncertainty = [];
  input.synthesis.evidenceGaps = [];

  const report = renderResearchReport(input);

  assert.match(
    report,
    /No material conflicts were identified/,
  );
  assert.match(
    report,
    /No material evidence gaps were recorded/,
  );
});

test("escapes Markdown supplied through source titles", () => {
  const input = createInput();
  input.sources[0].title = "Verification [Draft] *Study*";

  const report = renderResearchReport(input);

  assert.match(
    report,
    /Verification \\\[Draft\\\] \\\*Study\\\*/,
  );
});

test("rejects a source without an evidence assessment", () => {
  const input = createInput();
  input.analysis.sourceAssessments.pop();

  assert.throws(
    () => renderResearchReport(input),
    /Missing evidence assessment for source S2/,
  );
});
