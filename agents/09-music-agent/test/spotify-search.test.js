import test from "node:test";
import assert from "node:assert/strict";

import { searchSpotifyTrack } from "../src/spotify/search.js";

test("searches Spotify and normalizes track results", async () => {
  let capturedUrl;
  let capturedOptions;

  const results = await searchSpotifyTrack({
    title: "Suzanna",
    artist: "Sauti Sol",
    accessToken: "access-token",
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            tracks: {
              items: [
                {
                  id: "spotify-track-id",
                  uri: "spotify:track:spotify-track-id",
                  name: "Suzanna",
                  duration_ms: 235000,
                  explicit: false,
                  is_playable: true,
                  artists: [{ name: "Sauti Sol" }],
                  external_urls: {
                    spotify:
                      "https://open.spotify.com/track/spotify-track-id",
                  },
                },
              ],
            },
          };
        },
      };
    },
  });

  assert.match(
    capturedUrl.searchParams.get("q"),
    /track:Suzanna artist:Sauti Sol/,
  );
  assert.equal(
    capturedOptions.headers.Authorization,
    "Bearer access-token",
  );

  assert.deepEqual(results, [
    {
      id: "spotify-track-id",
      uri: "spotify:track:spotify-track-id",
      title: "Suzanna",
      artist: "Sauti Sol",
      durationMs: 235000,
      explicit: false,
      isPlayable: true,
      spotifyUrl:
        "https://open.spotify.com/track/spotify-track-id",
    },
  ]);
});

test("returns an empty array when Spotify finds no track", async () => {
  const results = await searchSpotifyTrack({
    title: "Unknown Track",
    artist: "Unknown Artist",
    accessToken: "access-token",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          tracks: {
            items: [],
          },
        };
      },
    }),
  });

  assert.deepEqual(results, []);
});

test("reports Spotify authorization failures", async () => {
  await assert.rejects(
    searchSpotifyTrack({
      title: "Suzanna",
      artist: "Sauti Sol",
      accessToken: "expired-token",
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        async text() {
          return "The access token expired";
        },
      }),
    }),
    /status 401.*expired/,
  );
});

test("searches Spotify using a broad catalogue query", async () => {
  const { searchSpotifyQuery } = await import(
    "../src/spotify/search.js"
  );

  let capturedUrl;

  const results = await searchSpotifyQuery({
    query: "Ghanaian highlife",
    accessToken: "access-token",
    limit: 10,
    fetchImpl: async (url) => {
      capturedUrl = url;

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            tracks: {
              items: [
                {
                  id: "highlife-id",
                  uri: "spotify:track:highlife-id",
                  name: "Real Highlife Track",
                  artists: [
                    {
                      name: "Real Artist",
                    },
                  ],
                  external_urls: {
                    spotify:
                      "https://open.spotify.com/track/highlife-id",
                  },
                },
              ],
            },
          };
        },
      };
    },
  });

  assert.equal(
    capturedUrl.searchParams.get("q"),
    "Ghanaian highlife",
  );
  assert.equal(
    capturedUrl.searchParams.get("limit"),
    "10",
  );
  assert.equal(results[0].id, "highlife-id");
  assert.equal(results[0].artist, "Real Artist");
});

test("rejects an empty broad Spotify query", async () => {
  const { searchSpotifyQuery } = await import(
    "../src/spotify/search.js"
  );

  await assert.rejects(
    searchSpotifyQuery({
      query: " ",
      accessToken: "access-token",
    }),
    /search query is required/,
  );
});
