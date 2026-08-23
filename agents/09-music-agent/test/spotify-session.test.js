import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  isSpotifySessionValid,
  loadSpotifySession,
  saveSpotifySession,
} from "../src/spotify/session.js";

test("saves and reloads a Spotify session with private permissions", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "music-agent-session-"),
  );
  const tokenPath = path.join(directory, "token.json");
  const tokenUrl = pathToFileURL(tokenPath);

  try {
    const session = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: 500000,
    };

    await saveSpotifySession(session, tokenUrl);

    assert.deepEqual(
      await loadSpotifySession(tokenUrl),
      session,
    );

    const stats = await fs.stat(tokenPath);
    assert.equal(stats.mode & 0o777, 0o600);
  } finally {
    await fs.rm(directory, {
      recursive: true,
      force: true,
    });
  }
});

test("returns null when no saved Spotify session exists", async () => {
  const missingUrl = pathToFileURL(
    path.join(
      os.tmpdir(),
      `missing-spotify-${Date.now()}.json`,
    ),
  );

  assert.equal(
    await loadSpotifySession(missingUrl),
    null,
  );
});

test("checks token expiry with a safety buffer", () => {
  assert.equal(
    isSpotifySessionValid(
      {
        accessToken: "access-token",
        expiresAt: 200000,
      },
      {
        now: () => 100000,
        expiryBufferMs: 60000,
      },
    ),
    true,
  );

  assert.equal(
    isSpotifySessionValid(
      {
        accessToken: "access-token",
        expiresAt: 150000,
      },
      {
        now: () => 100000,
        expiryBufferMs: 60000,
      },
    ),
    false,
  );
});

test("stores the default Spotify session at the project root", async () => {
  const { fileURLToPath } = await import("node:url");
  const { DEFAULT_TOKEN_URL } = await import(
    "../src/spotify/session.js"
  );

  const tokenPath = fileURLToPath(DEFAULT_TOKEN_URL);

  assert.equal(
    path.basename(tokenPath),
    ".spotify-token.json",
  );
  assert.equal(
    path.basename(path.dirname(tokenPath)),
    "09-music-agent",
  );
});
