import { generateArcDirection } from "./arc-director.js";
import { generateSearchPlan } from "./search-plan.js";
import { discoverSpotifyCandidates } from "./spotify/discovery.js";
import { sequencePlaylist } from "./sequencer.js";

export async function createPlaylistJourney({
  scenario,
  trackCount,
  model,
  client,
  accessToken,
  generateArcImpl = generateArcDirection,
  generateSearchPlanImpl = generateSearchPlan,
  discoverCandidatesImpl = discoverSpotifyCandidates,
  sequenceImpl = sequencePlaylist,
}) {
  const direction = await generateArcImpl({
    scenario,
    trackCount,
    model,
    client,
  });

  const plans = await generateSearchPlanImpl({
    scenario,
    direction,
    model,
    client,
  });

  const candidates = await discoverCandidatesImpl({
    plans,
    direction,
    accessToken,
    candidatesPerPosition: 2,
  });

  const playlist = sequenceImpl({
    candidates,
    arc: direction.arc,
    maxTracksPerArtist: 1,
  });

  return {
    direction,
    plans,
    candidates,
    playlist,
  };
}
