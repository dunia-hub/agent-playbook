import {
  isSpotifySessionValid,
  loadSpotifySession,
  saveSpotifySession,
} from "./session.js";
import { refreshSpotifySession } from "./token.js";

export async function getSpotifySession({
  clientId,
  loadSessionImpl = loadSpotifySession,
  saveSessionImpl = saveSpotifySession,
  refreshSessionImpl = refreshSpotifySession,
  now = Date.now,
}) {
  const session = await loadSessionImpl();

  if (!session) {
    throw new Error(
      "Spotify is not connected. Run npm run spotify:connect.",
    );
  }

  if (
    isSpotifySessionValid(session, {
      now,
    })
  ) {
    return session;
  }

  if (
    typeof session.refreshToken !== "string" ||
    session.refreshToken === ""
  ) {
    throw new Error(
      "Spotify session expired without a refresh token. Reconnect Spotify.",
    );
  }

  const refreshed = await refreshSessionImpl({
    clientId,
    refreshToken: session.refreshToken,
  });

  await saveSessionImpl(refreshed);

  return refreshed;
}
