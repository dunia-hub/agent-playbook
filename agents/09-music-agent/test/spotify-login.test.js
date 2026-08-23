import test from "node:test";
import assert from "node:assert/strict";

import { connectSpotify } from "../src/spotify/login.js";

test("connects Spotify through PKCE and saves the session", async () => {
  let displayedUrl;
  let callbackRequest;
  let exchangeRequest;
  let savedSession;

  const session = await connectSpotify({
    clientId: "client-id",
    redirectUri: "http://127.0.0.1:8888/callback",
    onAuthorizationUrl: (url) => {
      displayedUrl = url;
    },
    waitForCallbackImpl: async (request) => {
      callbackRequest = request;
      request.onListening();
      return "authorization-code";
    },
    exchangeCodeImpl: async (request) => {
      exchangeRequest = request;

      return {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 500000,
      };
    },
    saveSessionImpl: async (value) => {
      savedSession = value;
    },
  });

  const url = new URL(displayedUrl);

  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(
    url.searchParams.get("state"),
    callbackRequest.expectedState,
  );
  assert.equal(exchangeRequest.code, "authorization-code");
  assert.ok(exchangeRequest.codeVerifier.length >= 43);
  assert.deepEqual(savedSession, session);
});

test("does not exchange or save when callback authorization fails", async () => {
  let exchangeCalled = false;
  let saveCalled = false;

  await assert.rejects(
    connectSpotify({
      clientId: "client-id",
      redirectUri: "http://127.0.0.1:8888/callback",
      waitForCallbackImpl: async ({ onListening }) => {
        onListening();
        throw new Error("Spotify authorization was rejected.");
      },
      exchangeCodeImpl: async () => {
        exchangeCalled = true;
      },
      saveSessionImpl: async () => {
        saveCalled = true;
      },
    }),
    /authorization was rejected/,
  );

  assert.equal(exchangeCalled, false);
  assert.equal(saveCalled, false);
});
