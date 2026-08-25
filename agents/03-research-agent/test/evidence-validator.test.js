import test from "node:test";
import assert from "node:assert/strict";

import {
  parseEvidenceAnalysis,
  validateEvidenceAnalysis,
} from "../src/evidence-validator.js";

function createSources() {
  return [
    {
      id: "S1",
      title: "Verification Study",
      url: "https://example.com/study",
      content:
        "Research agents compare claims against retrieved source material before producing a final answer. The study also identifies incomplete evidence as a limitation.",
      taskIds: ["T1"],
    },
    {
      id: "S2",
      title: "Research Documentation",
      url: "https://docs.example.com/research",
      content:
        "Every important finding should retain a citation to the source that supports it. Conflicting sources should be reported clearly.",
      taskIds: ["T2"],
    },
  ];
}

function createValidAnalysis() {
  return {
    sourceAssessments: [
      {
        sourceId: "S1",
        sourceType: "academic",
        relevance: "high",
        quality: "strong",
        qualityReasons: [
          "The supplied text describes a verification method and a limitation.",
        ],
        findings: [
          {
            claim:
              "Research agents compare claims with retrieved source material.",
            support: "direct",
            taskIds: ["T1"],
            excerpt:
              "Research agents compare claims against retrieved source material",
          },
        ],
        limitations: [
          "The supplied excerpt does not describe the study methodology.",
        ],
      },
      {
        sourceId: "S2",
        sourceType: "official documentation",
        relevance: "high",
        quality: "mixed",
        qualityReasons: [
          "The source directly describes citation handling.",
        ],
        findings: [
          {
            claim:
              "Important findings should retain citations to supporting sources.",
            support: "direct",
            taskIds: ["T2"],
            excerpt:
              "Every important finding should retain a citation to the source that supports it",
          },
        ],
        limitations: [],
      },
    ],
    conflicts: [
      {
        topic: "Scope of verification guidance",
        sourceIds: ["S1", "S2"],
        description:
          "The sources emphasize different parts of the verification workflow.",
      },
    ],
    gaps: [
      "The supplied sources do not quantify verification accuracy.",
    ],
  };
}

test("parses valid evidence-analysis JSON", () => {
  const analysis = createValidAnalysis();

  assert.deepEqual(
    parseEvidenceAnalysis(JSON.stringify(analysis)),
    analysis,
  );
});

test("accepts a complete grounded evidence analysis", () => {
  const result = validateEvidenceAnalysis(
    createValidAnalysis(),
    createSources(),
  );

  assert.equal(result.sourceAssessments.length, 2);
  assert.equal(result.sourceAssessments[0].sourceId, "S1");
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.gaps.length, 1);
});

test("drops a fabricated supporting excerpt without discarding valid evidence", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[0].findings[0].excerpt =
    "This sentence never appeared in the source.";

  const result = validateEvidenceAnalysis(analysis, createSources());

  assert.equal(result.sourceAssessments[0].findings.length, 0);
  assert.equal(result.sourceAssessments[1].findings.length, 1);
});

test("drops an overlong excerpt without discarding valid evidence", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[0].findings[0].excerpt =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one";

  const result = validateEvidenceAnalysis(analysis, createSources());

  assert.equal(result.sourceAssessments[0].findings.length, 0);
  assert.equal(result.sourceAssessments[1].findings.length, 1);
});

test("rejects an analysis when every finding is unverifiable", () => {
  const analysis = createValidAnalysis();

  for (const assessment of analysis.sourceAssessments) {
    assessment.findings[0].excerpt = "A fabricated excerpt";
  }

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /did not contain any verifiable findings/,
  );
});

test("matches excerpts despite harmless punctuation differences", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[0].findings[0].excerpt =
    "Research agents compare claims—against retrieved source material";

  const result = validateEvidenceAnalysis(analysis, createSources());

  assert.equal(result.sourceAssessments[0].findings.length, 1);
});

test("rejects duplicate source assessments", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[1].sourceId = "S1";

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /assessed more than once/,
  );
});

test("rejects an analysis that omits a supplied source", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments.pop();

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /assess every supplied source exactly once/,
  );
});

test("rejects an unsupported quality rating", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[0].quality = "perfect";

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /quality is not allowed/,
  );
});

test("rejects conflicts containing unknown source IDs", () => {
  const analysis = createValidAnalysis();
  analysis.conflicts[0].sourceIds = ["S1", "S3"];

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /unknown source ID/,
  );
});

test("rejects a finding assigned to a task not connected to its source", () => {
  const analysis = createValidAnalysis();
  analysis.sourceAssessments[0].findings[0].taskIds = ["T2"];

  assert.throws(
    () => validateEvidenceAnalysis(analysis, createSources()),
    /not connected to source S1/,
  );
});

test("parses evidence JSON wrapped in a Markdown code fence", () => {
  const analysis = createValidAnalysis();
  const response = `\`\`\`json
${JSON.stringify(analysis)}
\`\`\``;

  assert.deepEqual(parseEvidenceAnalysis(response), analysis);
});

test("parses evidence JSON following a short introduction", () => {
  const analysis = createValidAnalysis();
  const response =
    `Here is the requested analysis:\n${JSON.stringify(analysis)}`;

  assert.deepEqual(parseEvidenceAnalysis(response), analysis);
});
