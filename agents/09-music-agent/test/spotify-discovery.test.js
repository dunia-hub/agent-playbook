import test from "node:test";
import assert from "node:assert/strict";

import { discoverSpotifyCandidates } from "../src/spotify/discovery.js";

const direction = {
  phases: [
    {
      name: "slow morning",
      tracks: 2,
      from: 3,
      to: 4,
    },
  ],
  arc: [
    {
      position: 1,
      phase: "slow morning",
      targetEnergy: 3,
    },
    {
      position: 2,
      phase: "slow morning",
      targetEnergy: 4,
    },
  ],
};

const plans = [
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
];

function result({
  id,
  title,
  artist,
  explicit = false,
  isPlayable = true,
}) {
  return {
    id,
    uri: `spotify:track:${id}`,
    title,
    artist,
    durationMs: 200000,
    explicit,
    isPlayable,
    spotifyUrl:
      `https://open.spotify.com/track/${id}`,
  };
}

test("discovers real Spotify tracks and assigns phase intent", async () => {
  const candidates = await discoverSpotifyCandidates({
    plans,
    direction,
    accessToken: "access-token",
    searchImpl: async ({ query }) => {
      if (query === "Swahili soul") {
        return [
          result({
            id: "one",
            title: "First Track",
            artist: "Artist One",
          }),
          result({
            id: "explicit",
            title: "Explicit Track",
            artist: "Artist Two",
            explicit: true,
          }),
          result({
            id: "duplicate-artist",
            title: "Another Track",
            artist: "Artist One, Guest",
          }),
        ];
      }

      return [
        result({
          id: "two",
          title: "Second Track",
          artist: "Artist Three",
        }),
        result({
          id: "three",
          title: "Third Track",
          artist: "Artist Four",
        }),
        result({
          id: "four",
          title: "Fourth Track",
          artist: "Artist Five",
        }),
      ];
    },
  });

  assert.equal(candidates.length, 4);
  assert.deepEqual(
    candidates.map((track) => track.energy),
    [3, 4, 3, 4],
  );
  assert.ok(
    candidates.every(
      (track) =>
        track.spotifyVerified &&
        track.phase === "slow morning",
    ),
  );
  assert.ok(
    candidates.every((track) => !track.explicit),
  );
  assert.deepEqual(
    new Set(
      candidates.map((track) => track.sourceQuery),
    ),
    new Set([
      "Swahili soul",
      "Kenyan acoustic",
    ]),
  );
  assert.equal(
    candidates.some(
      (track) =>
        track.id === "duplicate-artist",
    ),
    false,
  );
});

test("fails clearly when a phase lacks enough playable tracks", async () => {
  await assert.rejects(
    discoverSpotifyCandidates({
      plans,
      direction,
      accessToken: "access-token",
      searchImpl: async () => [
        result({
          id: "only-track",
          title: "Only Track",
          artist: "Only Artist",
        }),
      ],
    }),
    /found 1 of 2 required tracks/,
  );
});
