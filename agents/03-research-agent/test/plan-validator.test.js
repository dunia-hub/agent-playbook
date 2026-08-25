import test from "node:test";
import assert from "node:assert/strict";

import {
  parseResearchPlan,
  validateResearchPlan,
} from "../src/plan-validator.js";

const question = "How do research agents verify claims?";

function createValidPlan() {
  return {
    question,
    tasks: [
      {
        id: "T1",
        question: "What verification methods do research agents use?",
        purpose: "Identify the main verification approaches.",
        searchQueries: [
          "research agents claim verification methods",
          "retrieval augmented generation source verification",
        ],
      },
      {
        id: "T2",
        question: "What limitations affect automated verification?",
        purpose: "Identify known weaknesses and failure modes.",
        searchQueries: [
          "research agent verification limitations",
        ],
      },
    ],
    verificationNeeds: [
      "Whether cited sources directly support generated claims.",
    ],
  };
}

test("parses a valid JSON research plan", () => {
  const plan = createValidPlan();

  assert.deepEqual(parseResearchPlan(JSON.stringify(plan)), plan);
});

test("parses a research plan wrapped in a Markdown fence", () => {
  const plan = createValidPlan();
  const response = `\`\`\`json\n${JSON.stringify(plan)}\n\`\`\``;

  assert.deepEqual(parseResearchPlan(response), plan);
});

test("parses a research plan following a short introduction", () => {
  const plan = createValidPlan();

  assert.deepEqual(
    parseResearchPlan(`Here is the plan:\n${JSON.stringify(plan)}`),
    plan,
  );
});

test("rejects malformed JSON", () => {
  assert.throws(
    () => parseResearchPlan('{"question":'),
    /not valid JSON/,
  );
});

test("accepts and normalizes a valid research plan", () => {
  const result = validateResearchPlan(createValidPlan(), question);

  assert.equal(result.question, question);
  assert.equal(result.tasks.length, 2);
  assert.equal(result.tasks[0].id, "T1");
  assert.equal(result.verificationNeeds.length, 1);
});

test("preserves the original question when the model echo differs", () => {
  const plan = createValidPlan();
  plan.question = "A different question";

  const result = validateResearchPlan(plan, question);

  assert.equal(result.question, question);
});

test("rejects a plan with fewer than two tasks", () => {
  const plan = createValidPlan();
  plan.tasks = [plan.tasks[0]];

  assert.throws(
    () => validateResearchPlan(plan, question),
    /between 2 and 5 tasks/,
  );
});

test("narrows an over-scoped plan to three tasks", () => {
  const plan = createValidPlan();
  plan.tasks.push(
    { id: "T3", question: "Extra context?", purpose: "Extra.", searchQueries: ["extra context"] },
    { id: "T4", question: "More context?", purpose: "More.", searchQueries: ["more context"] },
  );

  const result = validateResearchPlan(plan, question);

  assert.deepEqual(result.tasks.map((task) => task.id), ["T1", "T2", "T3"]);
});

test("rejects incorrectly ordered task IDs", () => {
  const plan = createValidPlan();
  plan.tasks[1].id = "T3";

  assert.throws(
    () => validateResearchPlan(plan, question),
    /tasks\[1\]\.id must be T2/,
  );
});

test("rejects duplicate search queries regardless of case", () => {
  const plan = createValidPlan();
  plan.tasks[1].searchQueries = [
    "RESEARCH AGENTS CLAIM VERIFICATION METHODS",
  ];

  assert.throws(
    () => validateResearchPlan(plan, question),
    /Duplicate search query/,
  );
});

test("rejects unexpected fields in the plan", () => {
  const plan = createValidPlan();
  plan.answer = "An unsupported early answer";

  assert.throws(
    () => validateResearchPlan(plan, question),
    /must contain exactly/,
  );
});
