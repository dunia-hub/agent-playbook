import { scoreTransition } from "./transition.js";

function trackKey(track) {
  if (typeof track.id === "string" && track.id.trim() !== "") {
    return track.id;
  }

  return `${track.artist}::${track.title}`.toLowerCase();
}

function countArtist(playlist, artist) {
  const normalizedArtist = artist.trim().toLowerCase();

  return playlist.filter(
    (track) => track.artist.trim().toLowerCase() === normalizedArtist,
  ).length;
}

function expectedRole(arc, index) {
  if (index === 0) {
    return "opening";
  }

  if (index === arc.length - 1) {
    return "landing";
  }

  const previousEnergy = arc[index - 1].targetEnergy;
  const currentEnergy = arc[index].targetEnergy;

  if (currentEnergy >= 8) {
    return "peak";
  }

  if (currentEnergy > previousEnergy) {
    return "build";
  }

  if (currentEnergy < previousEnergy) {
    return "release";
  }

  return "bridge";
}

function chooseBestCandidate({
  candidates,
  playlist,
  slot,
  requiredRole,
  maxTracksPerArtist,
}) {
  const usedTrackKeys = new Set(playlist.map(trackKey));
  const previous = playlist.at(-1) ?? null;
  const usedArtists = playlist.map((track) => track.artist);

  const eligible = candidates.filter((candidate) => {
    const isUnusedTrack = !usedTrackKeys.has(trackKey(candidate));
    const artistHasCapacity =
      countArtist(playlist, candidate.artist) < maxTracksPerArtist;

    return isUnusedTrack && artistHasCapacity;
  });

  if (eligible.length === 0) {
    throw new Error(
      `No eligible track remains for playlist position ${slot.position}.`,
    );
  }

  return eligible
    .map((candidate) => {
      const transition = scoreTransition({
        previous,
        candidate,
        targetEnergy: slot.targetEnergy,
        usedArtists,
      });

      const rolePenalty =
        typeof candidate.role === "string" &&
        candidate.role !== requiredRole
          ? 30
          : 0;

      return {
        candidate,
        requiredRole,
        rolePenalty,
        score: {
          ...transition,
          total: Math.max(0, transition.total - rolePenalty),
        },
      };
    })
    .sort(
      (left, right) =>
        right.score.total - left.score.total ||
        left.candidate.title.localeCompare(right.candidate.title),
    )[0];
}

export function sequencePlaylist({
  candidates,
  arc,
  maxTracksPerArtist = 1,
}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("At least one candidate track is required.");
  }

  if (!Array.isArray(arc) || arc.length === 0) {
    throw new Error("A playlist arc is required.");
  }

  if (
    !Number.isInteger(maxTracksPerArtist) ||
    maxTracksPerArtist <= 0
  ) {
    throw new Error("maxTracksPerArtist must be a positive integer.");
  }

  return arc.reduce((playlist, slot, index) => {
    const selection = chooseBestCandidate({
      candidates,
      playlist,
      slot,
      requiredRole: expectedRole(arc, index),
      maxTracksPerArtist,
    });

    playlist.push({
      ...selection.candidate,
      position: slot.position,
      phase: slot.phase,
      targetEnergy: slot.targetEnergy,
      expectedRole: selection.requiredRole,
      rolePenalty: selection.rolePenalty,
      transitionScore: selection.score.total,
      scoreBreakdown: selection.score.breakdown,
    });

    return playlist;
  }, []);
}
