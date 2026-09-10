import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessageWithGroq } from "../src/groq.js";
import { MESSAGE_ANALYSIS_PROMPT } from "../src/prompt.js";

const response = {
  language: "sw",
  confidence: 0.98,
  intent: "meeting_link",
  searchTerms: ["kiungo"],
  urgency: "normal",
};

test("groq: sends only redacted text and supported languages", async () => {
  let captured;
  const client = {
    chat: {
      completions: {
        create: async (request) => {
          captured = request;
          return { choices: [{ message: { content: JSON.stringify(response) } }] };
        },
      },
    },
  };
  const result = await analyzeMessageWithGroq({
    redactedText: "Barua pepe ni [EMAIL]. Nahitaji kiungo.",
    supportedLanguages: ["en", "sw", "fr"],
    client,
    model: "test-model",
  });
  assert.deepEqual(result, response);
  assert.equal(captured.messages[0].content, MESSAGE_ANALYSIS_PROMPT);
  assert.match(captured.messages[1].content, /\[EMAIL\]/);
  assert.ok(!captured.messages[1].content.includes("person@example.com"));
});

test("groq: validates the returned analysis", async () => {
  const client = {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: '{"language":"sw"}' } }] }),
      },
    },
  };
  await assert.rejects(
    analyzeMessageWithGroq({
      redactedText: "Habari",
      supportedLanguages: ["sw"],
      client,
      model: "test-model",
    }),
    /missing/
  );
});

test("groq: rejects empty responses", async () => {
  const client = { chat: { completions: { create: async () => ({ choices: [] }) } } };
  await assert.rejects(
    analyzeMessageWithGroq({
      redactedText: "Hello",
      supportedLanguages: ["en"],
      client,
      model: "test-model",
    }),
    /empty analysis/
  );
});
