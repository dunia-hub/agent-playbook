import test from "node:test";
import assert from "node:assert/strict";
import { readContractWithGroq } from "../src/groq.js";

test("sends the contract and prompt to Groq and returns the response", async () => {
  let capturedRequest;

  const mockClient = {
    chat: {
      completions: {
        create: async (request) => {
          capturedRequest = request;

          return {
            choices: [
              {
                message: {
                  content: "Mock contract analysis",
                },
              },
            ],
          };
        },
      },
    },
  };

  const result = await readContractWithGroq({
    sourceCode: "contract Example {}",
    systemPrompt: "Read the contract.",
    client: mockClient,
    model: "test-model",
  });

  assert.equal(result, "Mock contract analysis");
  assert.equal(capturedRequest.model, "test-model");
  assert.equal(capturedRequest.temperature, 0);
  assert.equal(
    capturedRequest.messages[0].content,
    "Read the contract."
  );
  assert.match(
    capturedRequest.messages[1].content,
    /contract Example \{\}/
  );
});

test("rejects an empty Groq response", async () => {
  const mockClient = {
    chat: {
      completions: {
        create: async () => ({
          choices: [],
        }),
      },
    },
  };

  await assert.rejects(
    readContractWithGroq({
      sourceCode: "contract Example {}",
      systemPrompt: "Read the contract.",
      client: mockClient,
      model: "test-model",
    }),
    /Groq returned an empty response/
  );
});