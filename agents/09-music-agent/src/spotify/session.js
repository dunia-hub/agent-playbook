import fs from "node:fs/promises";

export const DEFAULT_TOKEN_URL = new URL(
  "../../.spotify-token.json",
  import.meta.url,
);

export function isSpotifySessionValid(
  session,
  {
    now = Date.now,
    expiryBufferMs = 60000,
  } = {},
) {
  return Boolean(
    session &&
      typeof session.accessToken === "string" &&
      session.accessToken !== "" &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt - expiryBufferMs > now(),
  );
}

export async function saveSpotifySession(
  session,
  tokenUrl = DEFAULT_TOKEN_URL,
) {
  if (
    typeof session?.accessToken !== "string" ||
    session.accessToken === ""
  ) {
    throw new Error(
      "Cannot save a Spotify session without an access token.",
    );
  }

  await fs.writeFile(
    tokenUrl,
    `${JSON.stringify(session, null, 2)}\n`,
    {
      encoding: "utf8",
      mode: 0o600,
    },
  );

  await fs.chmod(tokenUrl, 0o600);
}

export async function loadSpotifySession(
  tokenUrl = DEFAULT_TOKEN_URL,
) {
  try {
    const content = await fs.readFile(tokenUrl, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        "Saved Spotify session contains invalid JSON.",
      );
    }

    throw error;
  }
}
