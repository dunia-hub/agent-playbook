import test from "node:test";
import assert from "node:assert/strict";
import { createGroqClient, runWithGroq } from "../src/groq.js";

const response = {
  summary: "Prepare the agent.", actions: ["Run tests."], assumptions: [], safetyNotes: ["Keep secrets out."],
};

test("groq: sends the bounded prompt and validates the response", async () => {
  let request;
  const client = { chat: { completions: { create: async (value) => {
    request = value;
    return { choices: [{ message: { content: JSON.stringify(response) } }] };
  } } } };
  assert.deepEqual(await runWithGroq({ input: "Help", client, model: "test-model" }), response);
  assert.equal(request.model, "test-model");
  assert.equal(request.temperature, 0);
  assert.equal(request.messages[1].content, "Help");
});

test("groq: rejects an empty model response", async () => {
  const client = { chat: { completions: { create: async () => ({ choices: [] }) } } };
  await assert.rejects(() => runWithGroq({ input: "Help", client }), /must not be empty/);
});

test("groq: requires an API key when creating a live client", () => {
  assert.throws(() => createGroqClient(""), /GROQ_API_KEY/);
});
