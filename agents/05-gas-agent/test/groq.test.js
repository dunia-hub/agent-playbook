import test from "node:test";
import assert from "node:assert/strict";
import { explainFeeReport } from "../src/groq.js";
import {
  GAS_EXPLANATION_PROMPT,
  validateExplanation,
} from "../src/prompt.js";

const validExplanation = `## Fee Summary
- Base is ready.
## Cost Drivers
- Gas limit and fee.
## Budget Check
- Within limit.
## Risk Flags
- None.
## Next Action
- Refresh before signing.`;

test("groq: sends only the grounded report and returns validated sections", async () => {
  let captured;
  const client = {
    chat: {
      completions: {
        create: async (request) => {
          captured = request;
          return { choices: [{ message: { content: validExplanation } }] };
        },
      },
    },
  };
  const report = { bestFit: "Base Sepolia", readyCount: 1 };
  const result = await explainFeeReport({ report, client, model: "test-model" });
  assert.equal(result, validExplanation);
  assert.equal(captured.messages[0].content, GAS_EXPLANATION_PROMPT);
  assert.deepEqual(JSON.parse(captured.messages[1].content), report);
});

test("explanation: rejects missing sections", () => {
  assert.throws(() => validateExplanation("## Fee Summary\n- hi"), /missing sections/);
});

test("explanation: rejects sections in the wrong order", () => {
  const wrong = `## Cost Drivers
- Gas limit and fee.
## Fee Summary
- Base is ready.
## Budget Check
- Within limit.
## Risk Flags
- None.
## Next Action
- Refresh before signing.`;
  assert.throws(() => validateExplanation(wrong), /wrong order/);
});

test("groq: rejects an empty model response", async () => {
  const client = {
    chat: { completions: { create: async () => ({ choices: [] }) } },
  };
  await assert.rejects(
    explainFeeReport({ report: {}, client, model: "test-model" }),
    /empty explanation/
  );
});
