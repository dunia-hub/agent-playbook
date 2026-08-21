const SPOTIFY_API = "https://api.spotify.com/v1";

async function spotifyRequest({
  url,
  accessToken,
  method,
  body,
  fetchImpl,
}) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Spotify playlist request failed with status ${response.status}: ${details}`,
    );
  }

  return response.json();
}

export async function publishSpotifyPlaylist({
  name,
  description,
  tracks,
  accessToken,
  isPublic = false,
  fetchImpl = fetch,
}) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("A Spotify playlist name is required.");
  }

  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error(
      "At least one track is required to publish a playlist.",
    );
  }

  const uris = tracks.map((track) => track.spotifyUri);

  if (
    uris.some(
      (uri) =>
        typeof uri !== "string" ||
        !uri.startsWith("spotify:track:"),
    )
  ) {
    throw new Error(
      "Every published track must have a Spotify URI.",
    );
  }

  const playlist = await spotifyRequest({
    url: `${SPOTIFY_API}/me/playlists`,
    accessToken,
    method: "POST",
    body: {
      name: name.trim(),
      description: description.trim(),
      public: isPublic,
    },
    fetchImpl,
  });

  try {
    await spotifyRequest({
      url:
        `${SPOTIFY_API}/playlists/${playlist.id}/items`,
      accessToken,
      method: "POST",
      body: {
        uris,
      },
      fetchImpl,
    });
  } catch (error) {
    throw new Error(
      `Spotify created playlist "${playlist.name}" but could not add its tracks: ${error.message}`,
    );
  }

  return {
    id: playlist.id,
    name: playlist.name,
    spotifyUrl: playlist.external_urls?.spotify ?? null,
    trackCount: uris.length,
  };
}
