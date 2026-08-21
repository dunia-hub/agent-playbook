const SPOTIFY_SEARCH_URL =
  "https://api.spotify.com/v1/search";

function artistName(item) {
  return (item.artists ?? [])
    .map((artist) => artist.name)
    .filter(Boolean)
    .join(", ");
}

function normalizeItem(item) {
  return {
    id: item.id,
    uri: item.uri,
    title: item.name,
    artist: artistName(item),
    durationMs: item.duration_ms ?? null,
    explicit: item.explicit ?? false,
    isPlayable: item.is_playable ?? true,
    spotifyUrl: item.external_urls?.spotify ?? null,
  };
}

export async function searchSpotifyTrack({
  title,
  artist,
  accessToken,
  limit = 5,
  fetchImpl = fetch,
}) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("A track title is required.");
  }

  if (typeof artist !== "string" || artist.trim() === "") {
    throw new Error("An artist is required.");
  }

  if (
    typeof accessToken !== "string" ||
    accessToken.trim() === ""
  ) {
    throw new Error("A Spotify access token is required.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error("Spotify search limit must be between 1 and 10.");
  }

  const url = new URL(SPOTIFY_SEARCH_URL);

  url.searchParams.set(
    "q",
    `track:${title.trim()} artist:${artist.trim()}`,
  );
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(limit));

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Spotify search failed with status ${response.status}: ${details}`,
    );
  }

  const payload = await response.json();

  return (payload.tracks?.items ?? []).map(normalizeItem);
}

export async function searchSpotifyQuery({
  query,
  accessToken,
  limit = 10,
  offset = 0,
  fetchImpl = fetch,
}) {
  if (typeof query !== "string" || query.trim() === "") {
    throw new Error("A Spotify search query is required.");
  }

  if (
    typeof accessToken !== "string" ||
    accessToken.trim() === ""
  ) {
    throw new Error("A Spotify access token is required.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error("Spotify search limit must be between 1 and 10.");
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error(
      "Spotify search offset must be a non-negative integer.",
    );
  }

  const url = new URL(SPOTIFY_SEARCH_URL);

  url.searchParams.set("q", query.trim());
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Spotify search failed with status ${response.status}: ${details}`,
    );
  }

  const payload = await response.json();

  return (payload.tracks?.items ?? []).map(normalizeItem);
}
