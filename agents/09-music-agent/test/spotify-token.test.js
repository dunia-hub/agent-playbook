import test from "node:test";
import assert from "node:assert/strict";

import { exchangeSpotifyCode } from "../src/spotify/token.js";

test("exchanges a PKCE authorization code for Spotify tokens", async () => {
  let capturedUrl;
  let capturedOptions;

  const tokens = await exchangeSpotifyCode({
    clientId: "client-id",
    redirectUri: "http://127.0.0.1:8888/callback",
    code: "authorization-code",
    codeVerifier: "code-verifier",
    now: () => 1000,
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "Bearer",
            scope:
              "playlist-modify-private playlist-modify-public",
            expires_in: 3600,
          };
        },
      };
    },
  });

  assert.equal(
    capturedUrl,
    "https://accounts.spotify.com/api/token",
  );
  assert.equal(capturedOptions.method, "POST");
  assert.equal(
    capturedOptions.body.get("grant_type"),
    "authorization_code",
  );
  assert.equal(
    capturedOptions.body.get("code_verifier"),
    "code-verifier",
  );
  assert.equal(tokens.accessToken, "access-token");
  assert.equal(tokens.refreshToken, "refresh-token");
  assert.equal(tokens.expiresAt, 3601000);
});

test("reports a rejected token exchange", async () => {
  await assert.rejects(
    exchangeSpotifyCode({
      clientId: "client-id",
      redirectUri: "http://127.0.0.1:8888/callback",
      code: "bad-code",
      codeVerifier: "code-verifier",
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        async text() {
          return "invalid_grant";
        },
      }),
    }),
    /status 400: invalid_grant/,
  );
});

test("rejects a token response without an access token", async () => {
  await assert.rejects(
    exchangeSpotifyCode({
      clientId: "client-id",
      redirectUri: "http://127.0.0.1:8888/callback",
      code: "authorization-code",
      codeVerifier: "code-verifier",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            expires_in: 3600,
          };
        },
      }),
    }),
    /did not include an access token/,
  );
});

test("refreshes a Spotify token and preserves the refresh token", async () => {
  const { refreshSpotifySession } = await import(
    "../src/spotify/token.js"
  );

  const session = await refreshSpotifySession({
    clientId: "client-id",
    refreshToken: "existing-refresh-token",
    now: () => 1000,
    fetchImpl: async (_url, options) => ({
      ok: true,
      status: 200,
      async json() {
        assert.equal(
          options.body.get("grant_type"),
          "refresh_token",
        );

        return {
          access_token: "new-access-token",
          expires_in: 3600,
        };
      },
    }),
  });

  assert.equal(session.accessToken, "new-access-token");
  assert.equal(
    session.refreshToken,
    "existing-refresh-token",
  );
  assert.equal(session.expiresAt, 3601000);
});
