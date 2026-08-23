import test from "node:test";
import assert from "node:assert/strict";

import { scoreTransition } from "../src/transition.js";

const previous = {
  title: "Previous Track",
  artist: "Artist One",
  energy: 5,
  genres: ["afro-pop", "r&b"],
};

test("prefers a musical bridge over an abrupt genre and energy jump", () => {
  const bridge = {
    title: "Natural Bridge",
    artist: "Artist Two",
    energy: 6,
    genres: ["afro-pop", "soul"],
  };

  const abrupt = {
    title: "Abrupt Jump",
    artist: "Artist Three",
    energy: 9,
    genres: ["techno"],
  };

  const bridgeScore = scoreTransition({
    previous,
    candidate: bridge,
    targetEnergy: 6,
    usedArtists: ["Artist One"],
  });

  const abruptScore = scoreTransition({
    previous,
    candidate: abrupt,
    targetEnergy: 6,
    usedArtists: ["Artist One"],
  });

  assert.ok(bridgeScore.total > abruptScore.total);
  assert.equal(bridgeScore.total, 94);
});

test("penalizes an artist who already appears in the playlist", () => {
  const candidate = {
    title: "Another Song",
    artist: "Artist One",
    energy: 6,
    genres: ["afro-pop"],
  };

  const result = scoreTransition({
    previous,
    candidate,
    targetEnergy: 6,
    usedArtists: ["Artist One"],
  });

  assert.equal(result.breakdown.artistDiversity, 0);
  assert.deepEqual(result.warnings, ["repeated artist"]);
});

test("rejects invalid track energy", () => {
  assert.throws(
    () =>
      scoreTransition({
        candidate: {
          title: "Impossible Track",
          artist: "Artist Four",
          energy: 14,
          genres: [],
        },
        targetEnergy: 5,
      }),
    /between 1 and 10/,
  );
});
