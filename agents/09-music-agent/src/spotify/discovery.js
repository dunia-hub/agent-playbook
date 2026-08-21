import { searchSpotifyQuery } from "./search.js";

function artistKeys(track) {
  return track.artist
    .split(",")
    .map((artist) => artist.trim().toLowerCase())
    .filter(Boolean);
}

function hasUsedArtist(track, usedArtists) {
  return artistKeys(track).some((artist) =>
    usedArtists.has(artist),
  );
}

function rememberArtists(track, usedArtists) {
  for (const artist of artistKeys(track)) {
    usedArtists.add(artist);
  }
}

export async function discoverSpotifyCandidates({
  plans,
  direction,
  accessToken,
  candidatesPerPosition = 2,
  searchImpl = searchSpotifyQuery,
}) {
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error("Spotify search plans are required.");
  }

  if (
    !Number.isInteger(candidatesPerPosition) ||
    candidatesPerPosition <= 0
  ) {
    throw new Error(
      "candidatesPerPosition must be a positive integer.",
    );
  }

  const candidates = [];
  const usedTrackIds = new Set();
  const usedArtists = new Set();

  for (const plan of plans) {
    const phase = direction.phases.find(
      (item) =>
        item.name.trim().toLowerCase() ===
        plan.phase.trim().toLowerCase(),
    );

    if (!phase) {
      throw new Error(
        `Spotify discovery received an unknown phase: ${plan.phase}.`,
      );
    }

    const phaseSlots = direction.arc.filter(
      (slot) =>
        slot.phase.trim().toLowerCase() ===
        plan.phase.trim().toLowerCase(),
    );

    const minimumRequired = phase.tracks;
    const desiredCount =
      minimumRequired * candidatesPerPosition;
    const phaseCandidates = [];

    const queryResults = await Promise.all(
      plan.queries.map(async (query) => ({
        query,
        results: await searchImpl({
          query,
          accessToken,
          limit: 10,
        }),
      })),
    );

    const longestResultSet = Math.max(
      0,
      ...queryResults.map(
        ({ results }) => results.length,
      ),
    );

    for (
      let resultIndex = 0;
      resultIndex < longestResultSet;
      resultIndex += 1
    ) {
      for (const { query, results } of queryResults) {
        if (phaseCandidates.length >= desiredCount) {
          break;
        }

        const result = results[resultIndex];

        if (!result || !result.isPlayable) {
          continue;
        }

        if (!plan.allowExplicit && result.explicit) {
          continue;
        }

        if (
          usedTrackIds.has(result.id) ||
          hasUsedArtist(result, usedArtists)
        ) {
          continue;
        }

        const slot =
          phaseSlots[
            phaseCandidates.length %
              phaseSlots.length
          ];

        usedTrackIds.add(result.id);
        rememberArtists(result, usedArtists);

        phaseCandidates.push({
          id: result.id,
          title: result.title,
          artist: result.artist,
          durationMs: result.durationMs,
          explicit: result.explicit,
          spotifyUri: result.uri,
          spotifyUrl: result.spotifyUrl,
          spotifyVerified: true,
          energy: slot.targetEnergy,
          role: plan.role,
          genres: [...plan.genres],
          phase: phase.name,
          sourceQuery: query,
          reason:
            `Discovered on Spotify for the ${phase.name} phase.`,
        });
      }

      if (phaseCandidates.length >= desiredCount) {
        break;
      }
    }

    if (phaseCandidates.length < minimumRequired) {
      throw new Error(
        `Spotify discovery found ${phaseCandidates.length} of ${minimumRequired} required tracks for phase "${phase.name}".`,
      );
    }

    candidates.push(...phaseCandidates);
  }

  return candidates;
}
