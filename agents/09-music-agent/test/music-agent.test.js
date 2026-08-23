import test from "node:test";
import assert from "node:assert/strict";

import { createPlaylistJourney } from "../src/music-agent.js";

const direction = {
  playlistTitle: "Saturday Before the Doorbell",
  arcIntent: "A slow morning grows playful and social.",
  phases: [
    {
      name: "slow start",
      tracks: 1,
      from: 3,
      to: 3,
    },
    {
      name: "playful lift",
      tracks: 1,
      from: 7,
      to: 7,
    },
    {
      name: "friends arriving",
      tracks: 1,
      from: 5,
      to: 5,
    },
  ],
  arc: [
    {
      position: 1,
      phase: "slow start",
      targetEnergy: 3,
    },
    {
      position: 2,
      phase: "playful lift",
      targetEnergy: 7,
    },
    {
      position: 3,
      phase: "friends arriving",
      targetEnergy: 5,
    },
  ],
};

const plans = [
  {
    phase: "slow start",
    queries: ["Swahili soul"],
    genres: ["soul"],
    languages: ["Swahili"],
    role: "opening",
    allowExplicit: false,
  },
  {
    phase: "playful lift",
    queries: ["African dance pop"],
    genres: ["afro-pop"],
    languages: [],
    role: "build",
    allowExplicit: false,
  },
  {
    phase: "friends arriving",
    queries: ["African party classics"],
    genres: ["African pop"],
    languages: [],
    role: "landing",
    allowExplicit: false,
  },
];

const candidates = [
  {
    id: "slow",
    title: "Warm Start",
    artist: "Artist One",
    energy: 3,
    genres: ["soul"],
    role: "opening",
    spotifyUri: "spotify:track:slow",
  },
  {
    id: "lift",
    title: "Open Windows",
    artist: "Artist Two",
    energy: 7,
    genres: ["afro-pop"],
    role: "build",
    spotifyUri: "spotify:track:lift",
  },
  {
    id: "landing",
    title: "Doorbell",
    artist: "Artist Three",
    energy: 5,
    genres: ["African pop"],
    role: "landing",
    spotifyUri: "spotify:track:landing",
  },
];

test("composes arc, search planning, Spotify discovery, and sequencing", async () => {
  const calls = [];

  const result = await createPlaylistJourney({
    scenario: "A playful Saturday morning",
    trackCount: 3,
    model: "test-model",
    client: {},
    accessToken: "spotify-access-token",
    generateArcImpl: async () => {
      calls.push("arc");
      return direction;
    },
    generateSearchPlanImpl: async () => {
      calls.push("plan");
      return plans;
    },
    discoverCandidatesImpl: async (request) => {
      calls.push("spotify");
      assert.equal(
        request.accessToken,
        "spotify-access-token",
      );
      return candidates;
    },
  });

  assert.deepEqual(calls, [
    "arc",
    "plan",
    "spotify",
  ]);

  assert.equal(result.candidates.length, 3);
  assert.deepEqual(
    result.playlist.map((track) => track.title),
    ["Warm Start", "Open Windows", "Doorbell"],
  );
});

test("does not sequence when Spotify discovery fails", async () => {
  let sequenceWasCalled = false;

  await assert.rejects(
    createPlaylistJourney({
      scenario: "A playful morning",
      trackCount: 3,
      model: "test-model",
      client: {},
      accessToken: "spotify-access-token",
      generateArcImpl: async () => direction,
      generateSearchPlanImpl: async () => plans,
      discoverCandidatesImpl: async () => {
        throw new Error(
          "Spotify discovery found too few tracks.",
        );
      },
      sequenceImpl: () => {
        sequenceWasCalled = true;
        return [];
      },
    }),
    /too few tracks/,
  );

  assert.equal(sequenceWasCalled, false);
});
