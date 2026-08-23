import http from "node:http";

export function parseSpotifyCallback({
  callbackUrl,
  redirectUri,
  expectedState,
}) {
  const callback = new URL(callbackUrl);
  const redirect = new URL(redirectUri);

  if (
    callback.origin !== redirect.origin ||
    callback.pathname !== redirect.pathname
  ) {
    throw new Error("Spotify callback URL does not match the redirect URI.");
  }

  const spotifyError = callback.searchParams.get("error");

  if (spotifyError) {
    throw new Error(
      `Spotify authorization was rejected: ${spotifyError}.`,
    );
  }

  const state = callback.searchParams.get("state");

  if (state !== expectedState) {
    throw new Error("Spotify callback state did not match.");
  }

  const code = callback.searchParams.get("code");

  if (!code) {
    throw new Error(
      "Spotify callback did not include an authorization code.",
    );
  }

  return code;
}

export function waitForSpotifyCallback({
  redirectUri,
  expectedState,
  timeoutMs = 120000,
  onListening = () => {},
}) {
  const redirect = new URL(redirectUri);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      server.close();
      callback();
    };

    const server = http.createServer((request, response) => {
      const callbackUrl = new URL(
        request.url,
        redirect.origin,
      );

      if (callbackUrl.pathname !== redirect.pathname) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("Not found.");
        return;
      }

      try {
        const code = parseSpotifyCallback({
          callbackUrl: callbackUrl.toString(),
          redirectUri,
          expectedState,
        });

        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
        });
        response.end(
          "<h1>Spotify connected</h1><p>You can return to the terminal.</p>",
        );

        finish(() => resolve(code));
      } catch (error) {
        response.writeHead(400, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(error.message);

        finish(() => reject(error));
      }
    });

    server.on("error", (error) => {
      finish(() => reject(error));
    });

    server.listen(
      Number(redirect.port),
      redirect.hostname,
      onListening,
    );

    const timeout = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            "Spotify authorization timed out before the callback arrived.",
          ),
        ),
      );
    }, timeoutMs);
  });
}
