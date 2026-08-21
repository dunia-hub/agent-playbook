import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import Groq from "groq-sdk";

import { createPlaylistJourney } from "./music-agent.js";
import { getSpotifySession } from "./spotify/access.js";
import { publishSpotifyPlaylist } from "./spotify/playlist.js";

function requireEnvironment(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is missing from .env.`);
  }

  return value.trim();
}

function parseTrackCount(value) {
  if (value.trim() === "") {
    return 12;
  }

  const trackCount = Number(value);

  if (
    !Number.isInteger(trackCount) ||
    trackCount < 3 ||
    trackCount > 30
  ) {
    throw new Error("Track count must be an integer between 3 and 30.");
  }

  return trackCount;
}

function displayPlaylist(direction, playlist, candidateCount) {
  console.log(`\n## ${direction.playlistTitle}`);
  console.log(direction.arcIntent);

  console.log("\n## Playlist");

  for (const track of playlist) {
    console.log(
      `${track.position}. ${track.title} — ${track.artist}`,
    );
    console.log(
      `   ${track.phase} | energy ${track.energy}/10 | transition ${track.transitionScore}/100`,
    );
  }

  console.log("\n## The Arc");

  for (const phase of direction.phases) {
    console.log(
      `- ${phase.name}: ${phase.from}/10 → ${phase.to}/10 across ${phase.tracks} tracks`,
    );
  }

  console.log("\n## Verification");
  console.log(
    `${playlist.length} selected tracks verified through Spotify.`,
  );
  console.log(
    `${candidateCount} playable Spotify candidates were considered.`,
  );
}

async function main() {
  const groqApiKey = requireEnvironment("GROQ_API_KEY");
  const groqModel = requireEnvironment("GROQ_MODEL");
  const spotifyClientId = requireEnvironment(
    "SPOTIFY_CLIENT_ID",
  );

  const terminal = readline.createInterface({
    input,
    output,
  });

  try {
    console.log("Dunia Hub Music Agent\n");

    const scenario = await terminal.question(
      "Describe the listening journey:\n> ",
    );

    const trackCountInput = await terminal.question(
      "\nHow many tracks? Press Enter for 12:\n> ",
    );

    const trackCount = parseTrackCount(trackCountInput);
    const groq = new Groq({
      apiKey: groqApiKey,
    });

    const spotifySession = await getSpotifySession({
      clientId: spotifyClientId,
    });

    console.log(
      "\nDirecting the arc and discovering real tracks on Spotify...",
    );
    console.log(
      "Nothing will be added to Spotify without your confirmation.",
    );

    const {
      direction,
      plans,
      candidates,
      playlist,
    } = await createPlaylistJourney({
      scenario,
      trackCount,
      model: groqModel,
      client: groq,
      accessToken: spotifySession.accessToken,
    });

    console.log(`Title: ${direction.playlistTitle}`);
    console.log(
      `Arc: ${direction.phases.map((phase) => phase.name).join(" → ")}`,
    );
    console.log(
      `Discovered ${candidates.length} playable Spotify candidates across ${plans.length} phases.`,
    );

    displayPlaylist(
      direction,
      playlist,
      candidates.length,
    );

    const approval = await terminal.question(
      "\nCreate this private playlist in Spotify? (yes/no)\n> ",
    );

    if (!["yes", "y"].includes(approval.trim().toLowerCase())) {
      console.log("\nPlaylist preview finished. Nothing was created.");
      return;
    }

    console.log("\nCreating the playlist in Spotify...");

    const published = await publishSpotifyPlaylist({
      name: direction.playlistTitle,
      description:
        `${direction.arcIntent} Created by the Dunia Hub Music Agent.`,
      tracks: playlist,
      accessToken: spotifySession.accessToken,
      isPublic: false,
    });

    console.log(
      `\nSpotify playlist created with ${published.trackCount} tracks.`,
    );
    console.log(published.spotifyUrl);
  } finally {
    terminal.close();
  }
}

main().catch((error) => {
  console.error(`\nMusic Agent error: ${error.message}`);
  process.exitCode = 1;
});
