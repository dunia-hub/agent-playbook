import test from "node:test";
import assert from "node:assert/strict";

import { sequencePlaylist } from "../src/sequencer.js";

const candidates = [
  {
    id: "track-1",
    title: "Warm Opening",
    artist: "Artist Alpha",
    energy: 3,
    genres: ["afro-pop"],
  },
  {
    id: "track-2",
    title: "Faster Alpha Song",
    artist: "Artist Alpha",
    energy: 6,
    genres: ["afro-pop"],
  },
  {
    id: "track-3",
    title: "Natural Rise",
    artist: "Artist Beta",
    energy: 6,
    genres: ["afro-pop", "soul"],
  },
];

const arc = [
  {
    position: 1,
    phase: "departure",
    targetEnergy: 3,
  },
  {
    position: 2,
    phase: "lift",
    targetEnergy: 6,
  },
];

test("sequences tracks against the arc without repeating artists", () => {
  const playlist = sequencePlaylist({
    candidates,
    arc,
    maxTracksPerArtist: 1,
  });

  assert.deepEqual(
    playlist.map((track) => track.title),
    ["Warm Opening", "Natural Rise"],
  );

  assert.deepEqual(
    playlist.map((track) => track.artist),
    ["Artist Alpha", "Artist Beta"],
  );

  assert.equal(playlist[0].phase, "departure");
  assert.equal(playlist[1].targetEnergy, 6);
});

test("does not silently weaken a hard artist-diversity constraint", () => {
  assert.throws(
    () =>
      sequencePlaylist({
        candidates: candidates.slice(0, 2),
        arc,
        maxTracksPerArtist: 1,
      }),
    /No eligible track remains/,
  );
});

test("allows a configurable artist limit", () => {
  const playlist = sequencePlaylist({
    candidates: candidates.slice(0, 2),
    arc,
    maxTracksPerArtist: 2,
  });

  assert.equal(playlist.length, 2);
  assert.equal(playlist[0].artist, "Artist Alpha");
  assert.equal(playlist[1].artist, "Artist Alpha");
});
