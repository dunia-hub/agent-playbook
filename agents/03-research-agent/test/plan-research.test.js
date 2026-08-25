import test from "node:test";
import assert from "node:assert/strict";

import { createResearchPlan } from "../src/plan-research.js";

const question = "How do research agents verify claims?";

function validPlan() {
  return {
    question,
    tasks: [
      {
        id: "T1",
        question: "What methods are used to verify claims?",
        purpose: "Identify common verification methods.",
        searchQueries: [
          "research agent claim verification methods",
        ],
      },
      {
        id: "T2",
        question: "What limitations affect verification?",
        purpose: "Identify weaknesses and failure modes.",
        searchQueries: [
          "automated research verification limitations",
        ],
      },
    ],
    verificationNeeds: [
      "Whether sources directly support generated claims.",
    ],
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
  let callIndex = 0;

  return {
    requests,
    chat: {
      completions: {
        async create(request) {
          requests.push(request);

          const response = responses[callIndex];
          callIndex += 1;

          if (response instanceof Error) {
            throw response;
          }

          return response;
        },
      },
    },
  };
}

test("creates and validates a research plan through Groq", async () => {
  const client = createFakeClient([
    responseWith(JSON.stringify(validPlan())),
  ]);

  const plan = await createResearchPlan({
    question,
    client,
    model: "test-model",
    currentDate: "2026-08-24",
  });

  assert.equal(plan.question, question);
  assert.equal(plan.tasks.length, 2);
  assert.equal(client.requests.length, 1);
  assert.equal(client.requests[0].model, "test-model");
  assert.equal(client.requests[0].response_format.type, "json_object");
  assert.match(
    client.requests[0].messages[0].content,
    /Current date: 2026-08-24/,
  );
});

test("retries once when Groq returns malformed JSON", async () => {
  const client = createFakeClient([
    responseWith('{"question":'),
    responseWith(JSON.stringify(validPlan())),
  ]);

  const plan = await createResearchPlan({
    question,
    client,
    model: "test-model",
  });

  assert.equal(plan.tasks.length, 2);
  assert.equal(client.requests.length, 2);
  assert.match(
    client.requests[1].messages[0].content,
    /previous response was invalid/,
  );
});

test("fails after two invalid planning responses", async () => {
  const client = createFakeClient([
    responseWith("not JSON"),
    responseWith("{}"),
  ]);

  await assert.rejects(
    () =>
      createResearchPlan({
        question,
        client,
        model: "test-model",
      }),
    /Unable to create a valid research plan after 2 attempts/,
  );

  assert.equal(client.requests.length, 2);
});

test("rejects an invalid Groq client before making a request", async () => {
  await assert.rejects(
    () =>
      createResearchPlan({
        question,
        client: {},
        model: "test-model",
      }),
    /valid Groq client is required/,
  );
});

test("rejects a missing model before making a request", async () => {
  const client = createFakeClient([]);

  await assert.rejects(
    () =>
      createResearchPlan({
        question,
        client,
        model: " ",
      }),
    /GROQ_MODEL is required/,
  );

  assert.equal(client.requests.length, 0);
});
