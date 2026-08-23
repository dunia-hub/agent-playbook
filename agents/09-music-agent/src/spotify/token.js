const SPOTIFY_TOKEN_URL =
  "https://accounts.spotify.com/api/token";

export async function exchangeSpotifyCode({
  clientId,
  redirectUri,
  code,
  codeVerifier,
  fetchImpl = fetch,
  now = Date.now,
}) {
  for (const [name, value] of Object.entries({
    clientId,
    redirectUri,
    code,
    codeVerifier,
  })) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${name} is required.`);
    }
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code.trim(),
    redirect_uri: redirectUri.trim(),
    client_id: clientId.trim(),
    code_verifier: codeVerifier.trim(),
  });

  const response = await fetchImpl(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Spotify token exchange failed with status ${response.status}: ${details}`,
    );
  }

  const payload = await response.json();

  if (
    typeof payload.access_token !== "string" ||
    payload.access_token === ""
  ) {
    throw new Error(
      "Spotify token response did not include an access token.",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenType: payload.token_type ?? "Bearer",
    scope: payload.scope ?? "",
    expiresAt:
      now() + Number(payload.expires_in ?? 3600) * 1000,
  };
}

export async function refreshSpotifySession({
  clientId,
  refreshToken,
  fetchImpl = fetch,
  now = Date.now,
}) {
  if (typeof clientId !== "string" || clientId.trim() === "") {
    throw new Error("clientId is required.");
  }

  if (
    typeof refreshToken !== "string" ||
    refreshToken.trim() === ""
  ) {
    throw new Error("A Spotify refresh token is required.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken.trim(),
    client_id: clientId.trim(),
  });

  const response = await fetchImpl(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Spotify token refresh failed with status ${response.status}: ${details}`,
    );
  }

  const payload = await response.json();

  if (
    typeof payload.access_token !== "string" ||
    payload.access_token === ""
  ) {
    throw new Error(
      "Spotify refresh response did not include an access token.",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken:
      payload.refresh_token ?? refreshToken,
    tokenType: payload.token_type ?? "Bearer",
    scope: payload.scope ?? "",
    expiresAt:
      now() + Number(payload.expires_in ?? 3600) * 1000,
  };
}
