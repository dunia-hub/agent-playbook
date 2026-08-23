import test from "node:test";
import assert from "node:assert/strict";

import {
  SPOTIFY_SCOPES,
  buildSpotifyAuthorizeUrl,
  createCodeChallenge,
  createCodeVerifier,
  createState,
} from "../src/spotify/auth.js";

test("creates PKCE verifier and state values", () => {
  const verifier = createCodeVerifier();
  const state = createState();

  assert.ok(verifier.length >= 43);
  assert.match(verifier, /^[A-Za-z0-9_-]+$/);
  assert.match(state, /^[A-Za-z0-9_-]+$/);
});

test("creates the RFC 7636 SHA-256 challenge", () => {
  const verifier =
    "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

  assert.equal(
    createCodeChallenge(verifier),
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
});

test("builds a Spotify authorization URL with playlist scopes", () => {
  const result = buildSpotifyAuthorizeUrl({
    clientId: "client-id",
    redirectUri: "http://127.0.0.1:8888/callback",
    codeChallenge: "challenge",
    state: "state-value",
  });

  const url = new URL(result);

  assert.equal(
    url.origin,
    "https://accounts.spotify.com",
  );
  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(
    url.searchParams.get("code_challenge_method"),
    "S256",
  );
  assert.equal(
    url.searchParams.get("scope"),
    SPOTIFY_SCOPES.join(" "),
  );
});
