import test from "node:test";
import assert from "node:assert/strict";

import { buildEnergyArc } from "../src/arc.js";

test("builds a rise, peak, and landing across twelve tracks", () => {
  const phases = [
    { name: "warm departure", tracks: 4, from: 3, to: 5 },
    { name: "chaotic peak", tracks: 5, from: 6, to: 9 },
    { name: "sunset landing", tracks: 3, from: 6, to: 3 },
  ];

  const arc = buildEnergyArc(phases);

  assert.equal(arc.length, 12);

  assert.deepEqual(
    arc.map((position) => position.phase),
    [
      "warm departure",
      "warm departure",
      "warm departure",
      "warm departure",
      "chaotic peak",
      "chaotic peak",
      "chaotic peak",
      "chaotic peak",
      "chaotic peak",
      "sunset landing",
      "sunset landing",
      "sunset landing",
    ],
  );

  assert.deepEqual(
    arc.map((position) => position.targetEnergy),
    [3, 4, 4, 5, 6, 7, 8, 8, 9, 6, 5, 3],
  );
});

test("rejects phases with invalid energy values", () => {
  assert.throws(
    () =>
      buildEnergyArc([
        { name: "impossible", tracks: 3, from: 4, to: 12 },
      ]),
    /between 1 and 10/,
  );
});

test("rejects phases without any track positions", () => {
  assert.throws(
    () =>
      buildEnergyArc([
        { name: "empty", tracks: 0, from: 3, to: 5 },
      ]),
    /positive integer/,
  );
});
