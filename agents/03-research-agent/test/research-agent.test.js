import test from "node:test";
import assert from "node:assert/strict";

import { runResearchAgent } from "../src/research-agent.js";

function createPlan() {
  return {
    question: "How do research agents verify claims?",
    tasks: [
      {
        id: "T1",
        question: "Which methods are used?",
        purpose: "Identify verification methods.",
        searchQueries: ["verification methods"],
      },
      {
        id: "T2",
        question: "What are the limitations?",
        purpose: "Identify limitations.",
        searchQueries: ["verification limitations"],
      },
    ],
    verificationNeeds: ["Check claims against sources."],
  };
}

function createSources() {
  return [
    {
      id: "S1",
      title: "Study",
      url: "https://example.com/study",
      content: "Source one evidence.",
      taskIds: ["T1"],
    },
    {
      id: "S2",
      title: "Documentation",
      url: "https://docs.example.com",
      content: "Source two evidence.",
      taskIds: ["T2"],
    },
  ];
}

function createAnalysis() {
  return {
    sourceAssessments: [
      {
        sourceId: "S1",
        findings: [{ taskIds: ["T1"] }],
      },
      {
        sourceId: "S2",
        findings: [{ taskIds: ["T2"] }],
      },
    ],
    conflicts: [],
    gaps: [],
  };
}

function createSynthesis() {
  return {
    answer: "A supported answer.",
    keyFindings: [],
    conflictsAndUncertainty: [],
    evidenceGaps: [],
  };
}

test("composes every research stage in order", async () => {
  const calls = [];
  const progress = [];

  const result = await runResearchAgent({
    question: "How do research agents verify claims?",
    client: { fake: true },
    model: "test-model",
    currentDate: "2026-08-24",

    async plannerImpl(input) {
      calls.push(["planner", input.question, input.currentDate]);
      return createPlan();
    },

    async collectorImpl(input) {
      calls.push(["collector", input.plan.question]);
      return {
        sources: createSources(),
        failures: [
          {
            stage: "read",
            url: "https://blocked.example",
            error: "403",
          },
        ],
      };
    },

    async analyzerImpl(input) {
      calls.push(["analyzer", input.sources.length]);
      return createAnalysis();
    },

    async synthesizerImpl(input) {
      calls.push(["synthesizer", input.analysis.sourceAssessments.length]);
      return createSynthesis();
    },

    rendererImpl(input) {
      calls.push(["renderer", input.question]);
      return "# Mock Research Report";
    },

    async onProgress(message) {
      progress.push(message);
    },
  });

  assert.deepEqual(
    calls.map((call) => call[0]),
    [
      "planner",
      "collector",
      "analyzer",
      "synthesizer",
      "renderer",
    ],
  );

  assert.deepEqual(progress, [
    "Creating research plan",
    "Searching for relevant sources",
    "Analyzing evidence from 2 sources",
    "Synthesizing supported findings",
    "Research report complete",
  ]);

  assert.equal(result.report, "# Mock Research Report");
  assert.equal(result.sources.length, 2);
  assert.equal(result.retrievalFailures.length, 1);
});

test("stops when fewer than two readable sources are collected", async () => {
  let analyzerCalled = false;

  await assert.rejects(
    () =>
      runResearchAgent({
        question: "How do research agents verify claims?",
        client: {},
        model: "test-model",
        plannerImpl: async () => createPlan(),
        collectorImpl: async () => ({
          sources: [createSources()[0]],
          failures: [{ error: "Blocked" }, { error: "Timed out" }],
        }),
        analyzerImpl: async () => {
          analyzerCalled = true;
        },
      }),
    /only 1 readable sources were collected \(2 retrieval failures\)/,
  );

  assert.equal(analyzerCalled, false);
});

test("continues to analysis when retrieval covers only one task", async () => {
  let analyzerCalled = false;
  const oneSidedSources = createSources().map((source) => ({
    ...source,
    taskIds: ["T1"],
  }));

  const result = await runResearchAgent({
        question: "How do research agents verify claims?",
        client: {},
        model: "test-model",
        plannerImpl: async () => createPlan(),
        collectorImpl: async () => ({
          sources: oneSidedSources,
          failures: [],
        }),
        analyzerImpl: async () => {
          analyzerCalled = true;
          return {
            sourceAssessments: [
              { sourceId: "S1", quality: "mixed", relevance: "high", findings: [{ claim: "A supported method.", support: "direct", taskIds: ["T1"] }] },
              { sourceId: "S2", quality: "mixed", relevance: "medium", findings: [] },
            ],
            conflicts: [],
            gaps: [],
          };
        },
        rendererImpl: ({ synthesis }) => synthesis,
      });

  assert.equal(analyzerCalled, true);
  assert.equal(result.synthesis.status, "partial");
});

test("returns a partial synthesis when verified findings cover only one task", async () => {
  const result = await runResearchAgent({
        question: "How do research agents verify claims?",
        client: {},
        model: "test-model",
        plannerImpl: async () => createPlan(),
        collectorImpl: async () => ({
          sources: createSources(),
          failures: [],
        }),
        analyzerImpl: async () => ({
          sourceAssessments: [
            { sourceId: "S1", findings: [{ taskIds: ["T1"] }] },
            { sourceId: "S2", findings: [] },
          ],
          conflicts: [],
          gaps: ["No verified evidence answers T2."],
        }),
        synthesizerImpl: async ({ coverage }) => ({
          status: coverage.complete ? "complete" : "partial",
          answer: "A partial answer.",
          keyFindings: [],
          conflictsAndUncertainty: [],
          evidenceGaps: coverage.missingTasks.map((task) => task.question),
        }),
        rendererImpl: ({ synthesis }) => synthesis,
      });

  assert.equal(result.synthesis.status, "partial");
  assert.deepEqual(result.coverage.missingTasks, [
    { id: "T2", question: "What are the limitations?" },
  ]);
});

test("reports zero sources without crashing on missing failures", async () => {
  await assert.rejects(
    () =>
      runResearchAgent({
        question: "How do research agents verify claims?",
        client: {},
        model: "test-model",
        plannerImpl: async () => createPlan(),
        collectorImpl: async () => ({
          sources: [],
        }),
      }),
    /only 0 readable sources were collected \(0 retrieval failures\)/,
  );
});

test("rejects an invalid progress handler", async () => {
  await assert.rejects(
    () =>
      runResearchAgent({
        question: "How do research agents verify claims?",
        client: {},
        model: "test-model",
        onProgress: "log",
      }),
    /onProgress must be a function/,
  );
});

test("uses deterministic synthesis in the default runtime path", async () => {
  const result = await runResearchAgent({
    question: "How do research agents verify claims?",
    client: {},
    model: "test-model",
    plannerImpl: async () => createPlan(),
    collectorImpl: async () => ({
      sources: createSources(),
      failures: [],
    }),
    analyzerImpl: async () => ({
      sourceAssessments: [
        {
          sourceId: "S1",
          quality: "strong",
          relevance: "high",
          findings: [
            {
              claim: "Claims are compared with retrieved evidence.",
              support: "direct",
              taskIds: ["T1", "T2"],
            },
          ],
        },
        {
          sourceId: "S2",
          quality: "mixed",
          relevance: "medium",
          findings: [],
        },
      ],
      conflicts: [],
      gaps: [],
    }),
    rendererImpl: ({ synthesis }) => synthesis,
  });

  assert.equal(result.synthesis.keyFindings.length, 1);
  assert.deepEqual(result.synthesis.keyFindings[0].sourceIds, ["S1"]);
});
