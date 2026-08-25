import test from "node:test";
import assert from "node:assert/strict";

import { assembleSynthesis } from "../src/deterministic-synthesis.js";

test("assembles a cited synthesis without another model call", () => {
  const synthesis = assembleSynthesis({
    plan: {
      tasks: [
        { id: "T1", question: "What can agents do?" },
        { id: "T2", question: "How do chatbots differ?" },
      ],
    },
    analysis: {
      sourceAssessments: [
        {
          sourceId: "S1",
          quality: "strong",
          relevance: "high",
          findings: [
            {
              claim: "Agents can perform multi-step tasks.",
              support: "direct",
              taskIds: ["T1"],
            },
          ],
        },
        {
          sourceId: "S2",
          quality: "mixed",
          relevance: "high",
          findings: [
            {
              claim: "Chatbots primarily respond within conversations.",
              support: "partial",
              taskIds: ["T2"],
            },
          ],
        },
      ],
      conflicts: [],
      gaps: ["The sources do not provide a universal definition."],
    },
  });

  assert.equal(synthesis.keyFindings.length, 2);
  assert.equal(synthesis.status, "complete");
  assert.deepEqual(synthesis.keyFindings[0].evidenceIds, ["E1"]);
  assert.deepEqual(synthesis.keyFindings[0].sourceIds, ["S1"]);
  assert.equal(synthesis.keyFindings[0].confidence, "high");
  assert.equal(synthesis.keyFindings[1].confidence, "low");
  assert.deepEqual(synthesis.evidenceGaps, [
    "The sources do not provide a universal definition.",
  ]);
  assert.deepEqual(
    synthesis.answerSections.map((section) => section.heading),
    ["What can agents do?", "How do chatbots differ?"],
  );
});

test("keeps supported findings and labels an uncovered task partial", () => {
  const synthesis = assembleSynthesis({
    plan: {
      tasks: [
        { id: "T1", question: "What are the benefits?" },
        { id: "T2", question: "What are the risks?" },
      ],
    },
    analysis: {
      sourceAssessments: [
        {
          sourceId: "S1",
          quality: "mixed",
          relevance: "high",
          findings: [
            { claim: "Agents reduce response time.", support: "direct", taskIds: ["T1"] },
          ],
        },
      ],
      conflicts: [],
      gaps: [],
    },
  });

  assert.equal(synthesis.status, "partial");
  assert.equal(synthesis.answerSections[0].status, "supported");
  assert.equal(synthesis.answerSections[1].status, "insufficient evidence");
  assert.match(synthesis.evidenceGaps[0], /T2: What are the risks/);
});

test("does not give an uncorroborated numeric claim high confidence", () => {
  const synthesis = assembleSynthesis({
    plan: { tasks: [{ id: "T1", question: "What is the measured effect?" }] },
    analysis: {
      sourceAssessments: [
        {
          sourceId: "S1",
          quality: "strong",
          relevance: "high",
          findings: [
            {
              claim: "Processing time fell by 77%.",
              support: "direct",
              taskIds: ["T1"],
            },
          ],
        },
      ],
      conflicts: [],
      gaps: [],
    },
  });

  assert.equal(synthesis.keyFindings[0].confidence, "medium");
});
