import test from "node:test";
import assert from "node:assert/strict";
import { extractBookingIntent } from "../src/groq.js";
import { BOOKING_INTENT_PROMPT } from "../src/prompt.js";

test("groq: sends grounded context and returns the model response", async () => {
  let capturedRequest;
  const client = {
    chat: {
      completions: {
        create: async (request) => {
          capturedRequest = request;
          return { choices: [{ message: { content: ' {"title":"Call"} ' } }] };
        },
      },
    },
  };

  const result = await extractBookingIntent({
    request: "Meet Amina tomorrow",
    ownerTimeZone: "Africa/Nairobi",
    now: new Date("2026-09-10T06:00:00Z"),
    client,
    model: "test-model",
  });

  assert.equal(result, '{"title":"Call"}');
  assert.equal(capturedRequest.model, "test-model");
  assert.equal(capturedRequest.temperature, 0);
  assert.equal(capturedRequest.messages[0].content, BOOKING_INTENT_PROMPT);
  assert.match(capturedRequest.messages[1].content, /2026-09-10T06:00:00.000Z/);
  assert.match(capturedRequest.messages[1].content, /Africa\/Nairobi/);
  assert.match(capturedRequest.messages[1].content, /Meet Amina tomorrow/);
});

test("groq: rejects empty requests", async () => {
  await assert.rejects(
    extractBookingIntent({
      request: "   ",
      ownerTimeZone: "Africa/Nairobi",
      client: {},
      model: "test-model",
    }),
    /request is empty/
  );
});

test("groq: rejects empty model responses", async () => {
  const client = {
    chat: { completions: { create: async () => ({ choices: [] }) } },
  };
  await assert.rejects(
    extractBookingIntent({
      request: "Book a call",
      ownerTimeZone: "Africa/Nairobi",
      client,
      model: "test-model",
    }),
    /empty booking intent/
  );
});
