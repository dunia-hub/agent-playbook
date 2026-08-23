import "dotenv/config";
import { spawn } from "node:child_process";

import { connectSpotify } from "./login.js";

function requireEnvironment(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is missing from .env.`);
  }

  return value.trim();
}

function openBrowser(url) {
  console.log("\nOpen this URL if the browser does not open:");
  console.log(url);
  console.log();

  const child = spawn("xdg-open", [url], {
    detached: true,
    stdio: "ignore",
  });

  child.on("error", () => {});
  child.unref();
}

async function main() {
  console.log("Connecting Dunia Hub Music Agent to Spotify...");

  const session = await connectSpotify({
    clientId: requireEnvironment("SPOTIFY_CLIENT_ID"),
    redirectUri: requireEnvironment(
      "SPOTIFY_REDIRECT_URI",
    ),
    onAuthorizationUrl: openBrowser,
  });

  console.log(
    `Spotify connected. Access expires at ${new Date(
      session.expiresAt,
    ).toLocaleTimeString()}.`,
  );
}

main().catch((error) => {
  console.error(`Spotify connection error: ${error.message}`);
  process.exitCode = 1;
});
