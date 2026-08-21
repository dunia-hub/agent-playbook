import test from "node:test";
import assert from "node:assert/strict";

import { publishSpotifyPlaylist } from "../src/spotify/playlist.js";

test("creates a private Spotify playlist and adds ordered tracks", async () => {
  const requests = [];

  const result = await publishSpotifyPlaylist({
    name: "Morning Nairobi Vibes",
    description: "A slow morning that grows playful.",
    tracks: [
      {
        spotifyUri: "spotify:track:first",
      },
      {
        spotifyUri: "spotify:track:second",
      },
    ],
    accessToken: "access-token",
    fetchImpl: async (url, options) => {
      requests.push({
        url,
        options,
      });

      if (url.endsWith("/me/playlists")) {
        return {
          ok: true,
          status: 201,
          async json() {
            return {
              id: "playlist-id",
              name: "Morning Nairobi Vibes",
              external_urls: {
                spotify:
                  "https://open.spotify.com/playlist/playlist-id",
              },
            };
          },
        };
      }

      return {
        ok: true,
        status: 201,
        async json() {
          return {
            snapshot_id: "snapshot-id",
          };
        },
      };
    },
  });

  assert.equal(requests.length, 2);

  const createBody = JSON.parse(
    requests[0].options.body,
  );
  const addBody = JSON.parse(
    requests[1].options.body,
  );

  assert.equal(createBody.public, false);
  assert.deepEqual(addBody.uris, [
    "spotify:track:first",
    "spotify:track:second",
  ]);
  assert.equal(result.trackCount, 2);
  assert.equal(
    result.spotifyUrl,
    "https://open.spotify.com/playlist/playlist-id",
  );
});

test("does not call Spotify when a track lacks a URI", async () => {
  let fetchCalled = false;

  await assert.rejects(
    publishSpotifyPlaylist({
      name: "Invalid Playlist",
      description: "Missing a Spotify URI.",
      tracks: [
        {
          title: "Track without URI",
        },
      ],
      accessToken: "access-token",
      fetchImpl: async () => {
        fetchCalled = true;
      },
    }),
    /Every published track must have a Spotify URI/,
  );

  assert.equal(fetchCalled, false);
});

test("reports a partial failure if Spotify creates the playlist but rejects its tracks", async () => {
  let call = 0;

  await assert.rejects(
    publishSpotifyPlaylist({
      name: "Partial Playlist",
      description: "A test playlist.",
      tracks: [
        {
          spotifyUri: "spotify:track:first",
        },
      ],
      accessToken: "access-token",
      fetchImpl: async () => {
        call += 1;

        if (call === 1) {
          return {
            ok: true,
            status: 201,
            async json() {
              return {
                id: "playlist-id",
                name: "Partial Playlist",
                external_urls: {
                  spotify:
                    "https://open.spotify.com/playlist/playlist-id",
                },
              };
            },
          };
        }

        return {
          ok: false,
          status: 403,
          async text() {
            return "insufficient_scope";
          },
        };
      },
    }),
    /created playlist.*could not add its tracks/,
  );
});
