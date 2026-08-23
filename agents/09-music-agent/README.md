# Music Agent

The Music Agent is Workshop 09 in the Dunia Hub Agent Playbook series.

It turns a listening scenario into a real Spotify playlist with an intentional emotional arc.

Instead of asking an AI model to invent song titles, the agent uses Groq to design the musical journey and Spotify as the source of real, playable tracks.

## What It Does

The agent:

1. Accepts a listening scenario and playlist length.
2. Divides the experience into named musical phases.
3. Builds an energy curve across the playlist.
4. Generates broad Spotify search strategies for each phase.
5. Discovers real tracks directly from Spotify.
6. Filters unplayable and unwanted explicit tracks.
7. Prevents repeated tracks and credited artists.
8. Scores energy fit, genre continuity, transitions, artist diversity, and playlist roles.
9. Sequences the strongest candidates into a natural progression.
10. Shows the complete playlist before taking external action.
11. Creates a private Spotify playlist only after explicit approval.

## Example

Input:

```text
Friday evening energy after a long week, starting with relief and building into a proper celebration. Mostly African music, no heartbreak, no explicit tracks, and no repeated artists.
````

The agent returns:

```text
Playlist title
Arc description
Ordered Spotify tracks
Phase and energy for each position
Transition scores
Candidate and verification summary
```

It then asks:

```text
Create this private playlist in Spotify? (yes/no)
```

Entering `no` leaves Spotify unchanged.

## How It Works

```text
Listening scenario
        ↓
Groq playlist arc
        ↓
Groq Spotify search plan
        ↓
Spotify catalogue discovery
        ↓
Deterministic filtering and sequencing
        ↓
Playlist preview
        ↓
User approval
        ↓
Private Spotify playlist
```

Groq does not receive Spotify catalogue results. It creates phase-level search strategies such as `Swahili soul`, `Ghanaian highlife`, or `South African amapiano`. Spotify supplies the actual track titles, artists, and URIs.

## Requirements

* Node.js 20 or newer.
* A Groq API key.
* A Spotify account.
* A Spotify developer app using the Web API.

No paid AI API is required. Groq provides a free developer tier subject to its current usage limits.

## Installation

From this directory:

```bash
npm install
cp .env.example .env
```

Add your Groq API key, Groq model, and Spotify Client ID to `.env`.

Never commit `.env`, `.spotify-token.json`, a Spotify access token, or a refresh token.

## Spotify Setup

Create an app in the Spotify Developer Dashboard.

Use this redirect URI:

```text
http://127.0.0.1:8888/callback
```

The agent uses Authorization Code with PKCE and does not require a Spotify Client Secret.

Connect the agent:

```bash
npm run spotify:connect
```

Approve the requested playlist permissions in the browser. The saved session is private to the local user and refreshes automatically when the access token expires.

## Run

```bash
npm start
```

Describe the listening journey, choose the number of tracks, and review the generated playlist.

The playlist is private by default and is published only after a `yes` confirmation.

## Test

```bash
npm test
```

The test suite uses mocked Groq and Spotify responses. It does not make live API calls or create playlists.

The tests cover:

* Playlist arc construction and validation.
* Strict structured search plans.
* Spotify PKCE authentication and callback security.
* Token exchange, storage, expiry, and refresh.
* Catalogue search and phase-based discovery.
* Explicit track filtering.
* Track and artist diversity.
* Transition and role-aware sequencing.
* Playlist creation and partial failure reporting.
* Confirmation-safe orchestration.

## Safety and Privacy

* Spotify authorization uses PKCE.
* Callback state is validated.
* Session files use owner-only permissions.
* Secrets and tokens are gitignored.
* Spotify data is not sent to the AI model.
* External playlist creation requires explicit approval.
* Playlists are created as private by default.

## Limitations

* Energy values represent the intended phase progression, not Spotify audio-analysis measurements.
* Search results depend on Spotify catalogue availability and the user’s market.
* Broad catalogue queries can occasionally return unexpected but real tracks.
* Spotify developer-mode access is subject to Spotify’s current platform limits.
* If playlist creation succeeds but track insertion fails, an empty playlist may remain in the user’s account.

## Project Structure

```text
src/
  index.js
  music-agent.js
  arc.js
  arc-director.js
  search-plan.js
  sequencer.js
  transition.js
  spotify/
    access.js
    auth.js
    callback.js
    connect.js
    discovery.js
    login.js
    playlist.js
    search.js
    session.js
    token.js
```

## Contributing

Suggestions, tests, alternative sequencing strategies, and catalogue discovery improvements are welcome.