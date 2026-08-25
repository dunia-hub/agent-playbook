import test from "node:test";
import assert from "node:assert/strict";

import { buildEvidencePrompt } from "../src/evidence-prompt.js";

function createPlan() {
  return {
    question: "How do research agents verify claims?",
    tasks: [
      {
        id: "T1",
        question: "Which verification methods are used?",
        purpose: "Identify verification methods.",
        searchQueries: ["research agent verification methods"],
      },
      {
        id: "T2",
        question: "What limitations affect verification?",
        purpose: "Identify limitations.",
        searchQueries: ["research agent verification limitations"],
      },
    ],
    verificationNeeds: ["Check whether claims match their sources."],
  };
}

function createSource(id, content = `Evidence from ${id}.`) {
  return {
    id,
    title: `Source ${id}`,
    url: `https://example.com/${id.toLowerCase()}`,
    domain: "example.com",
    description: `Description for ${id}.`,
    publishedAt: "2026-08-01",
    taskIds: ["T1"],
    content,
  };
}

test("builds a dated evidence prompt with supplied sources", () => {
  const prompt = buildEvidencePrompt({
    plan: createPlan(),
    sources: [
      createSource("S1", "First source evidence."),
      createSource("S2", "Second source evidence."),
    ],
    currentDate: "2026-08-24",
  });

  assert.match(prompt, /Current date: 2026-08-24/);
  assert.match(
    prompt,
    /Research question: How do research agents verify claims\?/,
  );
  assert.match(prompt, /"sourceId": "S1"/);
  assert.match(prompt, /First source evidence/);
});

test("requires at least two readable sources", () => {
  assert.throws(
    () =>
      buildEvidencePrompt({
        plan: createPlan(),
        sources: [createSource("S1")],
      }),
    /At least 2 readable sources/,
  );
});

test("includes no more than four sources", () => {
  const sources = [
    createSource("S1"),
    createSource("S2"),
    createSource("S3"),
    createSource("S4"),
    createSource("S5"),
    createSource("S6", "SIXTH_SOURCE_MARKER"),
  ];

  const prompt = buildEvidencePrompt({
    plan: createPlan(),
    sources,
  });

  assert.match(prompt, /"id": "S4"/);
  assert.doesNotMatch(prompt, /"id": "S5"/);
  assert.doesNotMatch(prompt, /"id": "S6"/);
});

test("truncates long source content to 1800 characters", () => {
  const longContent = `${"A".repeat(1800)}TRUNCATED_MARKER`;

  const prompt = buildEvidencePrompt({
    plan: createPlan(),
    sources: [
      createSource("S1", longContent),
      createSource("S2", "Second source evidence."),
    ],
  });

  assert.doesNotMatch(prompt, /TRUNCATED_MARKER/);
  assert.ok(prompt.includes("A".repeat(1800)));
});

test("instructs the model to preserve conflicts and avoid invention", () => {
  const prompt = buildEvidencePrompt({
    plan: createPlan(),
    sources: [
      createSource("S1"),
      createSource("S2"),
    ],
  });

  assert.match(prompt, /Analyze only the supplied source material/);
  assert.match(prompt, /Record disagreements in conflicts/);
  assert.match(prompt, /Do not invent authors, dates, methods, statistics/);
  assert.match(prompt, /excerpt at 20 words or fewer/);
  assert.match(prompt, /only the task IDs that the finding itself answers/);
});
