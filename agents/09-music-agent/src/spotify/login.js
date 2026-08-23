import {
  buildSpotifyAuthorizeUrl,
  createCodeChallenge,
  createCodeVerifier,
  createState,
} from "./auth.js";
import { waitForSpotifyCallback } from "./callback.js";
import { saveSpotifySession } from "./session.js";
import { exchangeSpotifyCode } from "./token.js";

export async function connectSpotify({
  clientId,
  redirectUri,
  fetchImpl = fetch,
  timeoutMs = 120000,
  onAuthorizationUrl = () => {},
  waitForCallbackImpl = waitForSpotifyCallback,
  exchangeCodeImpl = exchangeSpotifyCode,
  saveSessionImpl = saveSpotifySession,
}) {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = createState();

  const authorizationUrl = buildSpotifyAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  });

  const code = await waitForCallbackImpl({
    redirectUri,
    expectedState: state,
    timeoutMs,
    onListening: () =>
      onAuthorizationUrl(authorizationUrl),
  });

  const session = await exchangeCodeImpl({
    clientId,
    redirectUri,
    code,
    codeVerifier,
    fetchImpl,
  });

  await saveSessionImpl(session);

  return session;
}
