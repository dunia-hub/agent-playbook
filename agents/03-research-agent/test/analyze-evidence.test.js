import test from "node:test";
import assert from "node:assert/strict";

import { analyzeEvidence } from "../src/analyze-evidence.js";

function createPlan() {
  return {
    question: "How do research agents verify claims?",
    tasks: [
      {
        id: "T1",
        question: "Which verification methods are used?",
        purpose: "Identify verification methods.",
        searchQueries: ["research verification methods"],
      },
      {
        id: "T2",
        question: "What limitations affect verification?",
        purpose: "Identify limitations.",
        searchQueries: ["research verification limitations"],
      },
    ],
    verificationNeeds: ["Check whether claims match sources."],
  };
}

function createSources() {
  return [
    {
      id: "S1",
      title: "Verification Study",
      url: "https://example.com/study",
      domain: "example.com",
      description: "A verification study.",
      publishedAt: "2026-08-01",
      taskIds: ["T1"],
      content:
        "Research agents compare claims against retrieved source material before producing a final answer.",
    },
    {
      id: "S2",
      title: "Citation Documentation",
      url: "https://docs.example.com/research",
      domain: "docs.example.com",
      description: "Citation guidance.",
      publishedAt: "2026-08-02",
      taskIds: ["T2"],
      content:
        "Every important finding should retain a citation to the source that supports it.",
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
        qualityReasons: ["The source directly describes verification."],
        findings: [
          {
            claim:
              "Research agents compare claims with retrieved material.",
            support: "direct",
            taskIds: ["T1"],
            excerpt:
              "Research agents compare claims against retrieved source material",
          },
        ],
        limitations: [],
      },
      {
        sourceId: "S2",
        sourceType: "official documentation",
        relevance: "high",
        quality: "mixed",
        qualityReasons: ["The source directly describes citation handling."],
        findings: [
          {
            claim:
              "Important findings should retain supporting citations.",
            support: "direct",
            taskIds: ["T2"],
            excerpt:
              "Every important finding should retain a citation to the source that supports it",
          },
        ],
        limitations: [],
      },
    ],
    conflicts: [],
    gaps: ["The supplied sources do not quantify accuracy."],
  };
}

function responseWith(content) {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

function createFakeClient(responses) {
  const requests = [];
  let index = 0;

  return {
    requests,
    chat: {
      completions: {
        async create(request) {
          requests.push(request);
          return responses[index++];
        },
      },
    },
  };
}

test("creates a validated evidence analysis through Groq", async () => {
  const client = createFakeClient([
    responseWith(JSON.stringify(createValidAnalysis())),
  ]);

  const analysis = await analyzeEvidence({
    plan: createPlan(),
    sources: createSources(),
    client,
    model: "test-model",
    currentDate: "2026-08-24",
  });

  assert.equal(analysis.sourceAssessments.length, 2);
  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0].model, "test-model");
  assert.equal(client.requests[0].max_completion_tokens, 1600);
  assert.equal(client.requests[0].response_format.type, "json_schema");
  assert.equal(
    client.requests[0].response_format.json_schema.strict,
    true,
  );
  assert.deepEqual(
    client.requests[0].response_format.json_schema.schema.required,
    ["sourceAssessments", "conflicts", "gaps"],
  );
  assert.match(
    client.requests[0].messages[0].content,
    /Current date: 2026-08-24/,
  );
});

test("drops an unverifiable finding without another Groq call", async () => {
  const invalidAnalysis = createValidAnalysis();
  invalidAnalysis.sourceAssessments[0].findings[0].excerpt =
    "A fabricated excerpt";

  const client = createFakeClient([
    responseWith(JSON.stringify(invalidAnalysis)),
    responseWith(JSON.stringify(createValidAnalysis())),
  ]);

  const analysis = await analyzeEvidence({
    plan: createPlan(),
    sources: createSources(),
    client,
    model: "test-model",
  });

  assert.equal(analysis.sourceAssessments.length, 2);
  assert.equal(analysis.sourceAssessments[0].findings.length, 0);
  assert.equal(analysis.sourceAssessments[1].findings.length, 1);
  assert.equal(client.requests.length, 1);
});

test("fails after two invalid evidence responses", async () => {
  const client = createFakeClient([
    responseWith("not JSON"),
    responseWith("{}"),
  ]);

  await assert.rejects(
    () =>
      analyzeEvidence({
        plan: createPlan(),
        sources: createSources(),
        client,
        model: "test-model",
      }),
    /Unable to produce valid evidence analysis after 2 attempts/,
  );

  assert.equal(client.requests.length, 2);
});

test("rejects an invalid Groq client", async () => {
  await assert.rejects(
    () =>
      analyzeEvidence({
        plan: createPlan(),
        sources: createSources(),
        client: {},
        model: "test-model",
      }),
    /valid Groq client is required/,
  );
});

test("rejects a missing model", async () => {
  const client = createFakeClient([]);

  await assert.rejects(
    () =>
      analyzeEvidence({
        plan: createPlan(),
        sources: createSources(),
        client,
        model: "",
      }),
    /GROQ_MODEL is required/,
  );
});
