import test from "node:test";
import assert from "node:assert/strict";

import { generateSearchPlan } from "../src/search-plan.js";

const direction = {
  arcIntent: "Begin slowly and grow playful.",
  phases: [
    {
      name: "slow morning",
      tracks: 2,
      from: 3,
      to: 4,
    },
    {
      name: "playful cleaning",
      tracks: 3,
      from: 5,
      to: 8,
    },
  ],
};

function fakeClient(payload, capture = {}) {
  return {
    chat: {
      completions: {
        async create(request) {
          capture.request = request;

          return {
            choices: [
              {
                message: {
                  content: JSON.stringify(payload),
                },
              },
            ],
          };
        },
      },
    },
  };
}

const validPlans = {
  plans: [
    {
      phase: "slow morning",
      queries: [
        "Swahili soul",
        "Kenyan acoustic",
      ],
      genres: ["soul", "acoustic"],
      languages: ["Swahili"],
      role: "opening",
      allowExplicit: false,
    },
    {
      phase: "playful cleaning",
      queries: [
        "Ghanaian highlife",
        "African dance pop",
      ],
      genres: ["highlife", "afro-pop"],
      languages: [],
      role: "build",
      allowExplicit: false,
    },
  ],
};

test("creates a strict catalogue-first plan for every phase", async () => {
  const capture = {};

  const plans = await generateSearchPlan({
    scenario: "A playful Saturday morning",
    direction,
    model: "test-model",
    client: fakeClient(validPlans, capture),
  });

  assert.equal(plans.length, 2);
  assert.equal(plans[0].phase, "slow morning");
  assert.equal(
    capture.request.response_format.json_schema.strict,
    true,
  );
  assert.match(
    capture.request.messages[0].content,
    /Do not propose track titles/i,
  );
});

test("rejects a search plan with a missing phase", async () => {
  await assert.rejects(
    generateSearchPlan({
      scenario: "A playful morning",
      direction,
      model: "test-model",
      client: fakeClient({
        plans: [validPlans.plans[0]],
      }),
    }),
    /missing phase: playful cleaning/,
  );
});

test("rejects a search plan with an unknown phase", async () => {
  await assert.rejects(
    generateSearchPlan({
      scenario: "A playful morning",
      direction,
      model: "test-model",
      client: fakeClient({
        plans: [
          ...validPlans.plans,
          {
            ...validPlans.plans[0],
            phase: "invented phase",
          },
        ],
      }),
    }),
    /unknown phase: invented phase/,
  );
});
