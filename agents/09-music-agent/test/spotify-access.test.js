import test from "node:test";
import assert from "node:assert/strict";

import { getSpotifySession } from "../src/spotify/access.js";

test("reuses a Spotify session that is still valid", async () => {
  const session = {
    accessToken: "current-token",
    refreshToken: "refresh-token",
    expiresAt: 500000,
  };

  let refreshCalled = false;

  const result = await getSpotifySession({
    clientId: "client-id",
    now: () => 100000,
    loadSessionImpl: async () => session,
    refreshSessionImpl: async () => {
      refreshCalled = true;
    },
  });

  assert.deepEqual(result, session);
  assert.equal(refreshCalled, false);
});

test("refreshes and saves an expired Spotify session", async () => {
  let savedSession;

  const result = await getSpotifySession({
    clientId: "client-id",
    now: () => 100000,
    loadSessionImpl: async () => ({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: 120000,
    }),
    refreshSessionImpl: async ({ refreshToken }) => ({
      accessToken: "new-token",
      refreshToken,
      expiresAt: 500000,
    }),
    saveSessionImpl: async (session) => {
      savedSession = session;
    },
  });

  assert.equal(result.accessToken, "new-token");
  assert.deepEqual(savedSession, result);
});

test("requires Spotify connection when no session is saved", async () => {
  await assert.rejects(
    getSpotifySession({
      clientId: "client-id",
      loadSessionImpl: async () => null,
    }),
    /npm run spotify:connect/,
  );
});
