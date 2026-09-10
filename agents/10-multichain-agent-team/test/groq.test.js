import test from "node:test";
import assert from "node:assert/strict";
import { planWithGroq } from "../src/groq.js";
import { MULTICHAIN_PLANNER_PROMPT } from "../src/prompt.js";

const plan = {
  goal: "Prepare a demo",
  executionMode: "plan_only",
  operations: [],
  notes: [],
};

test("groq: sends a bounded registry and policy context", async () => {
  let captured;
  const client = {
    chat: {
      completions: {
        create: async (request) => {
          captured = request;
          return { choices: [{ message: { content: JSON.stringify(plan) } }] };
        },
      },
    },
  };
  const result = await planWithGroq({
    request: "Prepare a demo only",
    registry: {
      networks: [
        {
          id: "base",
          name: "Base Sepolia",
          family: "evm",
          testnet: true,
          nativeAsset: { symbol: "ETH", decimals: 18 },
          explorerUrl: "https://not-sent.example",
        },
      ],
    },
    policy: {
      testnetOnly: true,
      maxOperations: 3,
      allowedActions: ["prepare_native_transfer"],
      maxTransferByNetwork: { base: "0.1" },
      internalNote: "not sent",
    },
    client,
    model: "test-model",
  });
  assert.deepEqual(result, plan);
  assert.equal(captured.messages[0].content, MULTICHAIN_PLANNER_PROMPT);
  assert.match(captured.messages[1].content, /Prepare a demo only/);
  assert.ok(!captured.messages[1].content.includes("internalNote"));
  assert.ok(!captured.messages[1].content.includes("explorerUrl"));
});

test("groq: rejects empty goals and model responses", async () => {
  await assert.rejects(
    planWithGroq({ request: " ", registry: { networks: [] }, policy: {}, client: {} }),
    /Goal request is empty/
  );
  const client = { chat: { completions: { create: async () => ({ choices: [] }) } } };
  await assert.rejects(
    planWithGroq({
      request: "Prepare a demo",
      registry: { networks: [] },
      policy: { testnetOnly: true, maxOperations: 1, allowedActions: [], maxTransferByNetwork: {} },
      client,
      model: "test-model",
    }),
    /empty plan/
  );
});
