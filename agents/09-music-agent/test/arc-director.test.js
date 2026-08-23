import test from "node:test";
import assert from "node:assert/strict";

import { generateArcDirection } from "../src/arc-director.js";

const validDirection = {
  playlistTitle: "Headlights After Good News",
  arcIntent: "Warm reflection rises and then lands softly.",
  phases: [
    { name: "departure", tracks: 2, from: 3, to: 5 },
    { name: "celebration", tracks: 2, from: 6, to: 9 },
    { name: "landing", tracks: 1, from: 4, to: 3 },
  ],
};

function sequenceClient(payloads, capture = {}) {
  let index = 0;

  return {
    chat: {
      completions: {
        async create(request) {
          capture.calls = (capture.calls ?? 0) + 1;
          capture.lastRequest = request;

          const payload = payloads[index];
          index += 1;

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

test("generates a validated arc without candidate tracks", async () => {
  const capture = {};

  const result = await generateArcDirection({
    scenario: "A night drive after good news",
    trackCount: 5,
    model: "test-model",
    client: sequenceClient([validDirection], capture),
  });

  assert.equal(result.arc.length, 5);
  assert.equal(result.playlistTitle, "Headlights After Good News");
  assert.equal(capture.lastRequest.reasoning_effort, "low");
  assert.equal(capture.lastRequest.max_completion_tokens, 1200);
});

test("retries an arc whose phase counts are incorrect", async () => {
  const invalidDirection = {
    ...validDirection,
    phases: [
      { name: "too short", tracks: 2, from: 3, to: 5 },
      { name: "ending", tracks: 2, from: 6, to: 3 },
    ],
  };

  const capture = {};

  const result = await generateArcDirection({
    scenario: "A night drive",
    trackCount: 5,
    model: "test-model",
    client: sequenceClient(
      [invalidDirection, validDirection],
      capture,
    ),
  });

  assert.equal(capture.calls, 2);
  assert.equal(result.arc.length, 5);
});

test("fails clearly after two invalid arc responses", async () => {
  const invalid = {
    playlistTitle: "Broken Arc",
    arcIntent: "Incomplete.",
    phases: [{ name: "only phase", tracks: 5, from: 3, to: 6 }],
  };

  await assert.rejects(
    generateArcDirection({
      scenario: "A night drive",
      trackCount: 5,
      model: "test-model",
      client: sequenceClient([invalid, invalid]),
    }),
    /after two attempts/,
  );
});
