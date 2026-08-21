function normalize(value) {
  return value.trim().toLowerCase();
}

function validateTrack(track) {
  if (!track || typeof track !== "object") {
    throw new Error("A track must be provided.");
  }

  if (typeof track.artist !== "string" || track.artist.trim() === "") {
    throw new Error("Each track must have an artist.");
  }

  if (!Number.isFinite(track.energy) || track.energy < 1 || track.energy > 10) {
    throw new Error("Track energy must be between 1 and 10.");
  }

  if (!Array.isArray(track.genres)) {
    throw new Error("Track genres must be an array.");
  }
}

function hasSharedGenre(previous, candidate) {
  const previousGenres = new Set(previous.genres.map(normalize));
  return candidate.genres.some((genre) => previousGenres.has(normalize(genre)));
}

export function scoreTransition({
  previous = null,
  candidate,
  targetEnergy,
  usedArtists = [],
}) {
  validateTrack(candidate);

  if (previous) {
    validateTrack(previous);
  }

  if (
    !Number.isFinite(targetEnergy) ||
    targetEnergy < 1 ||
    targetEnergy > 10
  ) {
    throw new Error("Target energy must be between 1 and 10.");
  }

  const energyFit = Math.max(
    0,
    40 - Math.abs(candidate.energy - targetEnergy) * 10,
  );

  const smoothness = previous
    ? Math.max(0, 25 - Math.abs(candidate.energy - previous.energy) * 6)
    : 25;

  const genreContinuity = previous
    ? hasSharedGenre(previous, candidate)
      ? 15
      : 5
    : 15;

  const artistWasUsed = usedArtists
    .map(normalize)
    .includes(normalize(candidate.artist));

  const artistDiversity = artistWasUsed ? 0 : 20;

  return {
    total:
      energyFit +
      smoothness +
      genreContinuity +
      artistDiversity,
    breakdown: {
      energyFit,
      smoothness,
      genreContinuity,
      artistDiversity,
    },
    warnings: artistWasUsed ? ["repeated artist"] : [],
  };
}
