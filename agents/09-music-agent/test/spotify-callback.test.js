import test from "node:test";
import assert from "node:assert/strict";

import { parseSpotifyCallback } from "../src/spotify/callback.js";

const redirectUri = "http://127.0.0.1:8888/callback";

test("accepts a Spotify callback with the expected state", () => {
  const code = parseSpotifyCallback({
    callbackUrl:
      `${redirectUri}?code=authorization-code&state=expected-state`,
    redirectUri,
    expectedState: "expected-state",
  });

  assert.equal(code, "authorization-code");
});

test("rejects a callback with the wrong state", () => {
  assert.throws(
    () =>
      parseSpotifyCallback({
        callbackUrl:
          `${redirectUri}?code=authorization-code&state=wrong-state`,
        redirectUri,
        expectedState: "expected-state",
      }),
    /state did not match/,
  );
});

test("reports when the user denies Spotify authorization", () => {
  assert.throws(
    () =>
      parseSpotifyCallback({
        callbackUrl:
          `${redirectUri}?error=access_denied&state=expected-state`,
        redirectUri,
        expectedState: "expected-state",
      }),
    /authorization was rejected: access_denied/,
  );
});

test("rejects a callback sent to a different path", () => {
  assert.throws(
    () =>
      parseSpotifyCallback({
        callbackUrl:
          "http://127.0.0.1:8888/wrong?code=a&state=expected-state",
        redirectUri,
        expectedState: "expected-state",
      }),
    /does not match the redirect URI/,
  );
});
