import crypto from "node:crypto";

const SPOTIFY_AUTHORIZE_URL =
  "https://accounts.spotify.com/authorize";

export const SPOTIFY_SCOPES = [
  "playlist-modify-private",
  "playlist-modify-public",
];

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createCodeVerifier() {
  return base64Url(crypto.randomBytes(64));
}

export function createState() {
  return base64Url(crypto.randomBytes(24));
}

export function createCodeChallenge(codeVerifier) {
  if (
    typeof codeVerifier !== "string" ||
    codeVerifier.length < 43 ||
    codeVerifier.length > 128
  ) {
    throw new Error(
      "PKCE code verifier must contain between 43 and 128 characters.",
    );
  }

  return base64Url(
    crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest(),
  );
}

export function buildSpotifyAuthorizeUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state,
  scopes = SPOTIFY_SCOPES,
}) {
  for (const [name, value] of Object.entries({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  })) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${name} is required.`);
    }
  }

  const url = new URL(SPOTIFY_AUTHORIZE_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set(
    "scope",
    scopes.join(" "),
  );
  url.searchParams.set(
    "code_challenge_method",
    "S256",
  );
  url.searchParams.set(
    "code_challenge",
    codeChallenge,
  );
  url.searchParams.set("state", state);

  return url.toString();
}
