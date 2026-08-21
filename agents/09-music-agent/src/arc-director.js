import { buildEnergyArc } from "./arc.js";

function buildArcPrompt({ scenario, trackCount }) {
  return `
You are directing the emotional movement of a playlist.

LISTENING SCENARIO
${JSON.stringify(scenario.trim())}

PLAYLIST LENGTH
${trackCount} tracks

Decide how the music should move from the opening track to the final track.
Create two to five named phases. The phase track counts must total exactly
${trackCount}. Energy values must be integers from 1 to 10.

Return valid JSON only:

{
  "playlistTitle": "A distinctive title",
  "arcIntent": "One sentence explaining the musical journey",
  "phases": [
    {
      "name": "Phase name",
      "tracks": 4,
      "from": 3,
      "to": 6
    }
  ]
}
`.trim();
}

function parseArc(content) {
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Groq returned an empty arc direction.");
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Groq returned invalid arc JSON.");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Groq returned invalid arc JSON.");
  }
}

function validateArcDirection(direction, trackCount) {
  if (
    typeof direction?.playlistTitle !== "string" ||
    direction.playlistTitle.trim() === ""
  ) {
    throw new Error("Arc direction requires a playlist title.");
  }

  if (
    typeof direction.arcIntent !== "string" ||
    direction.arcIntent.trim() === ""
  ) {
    throw new Error("Arc direction requires an arc intent.");
  }

  if (
    !Array.isArray(direction.phases) ||
    direction.phases.length < 2 ||
    direction.phases.length > 5
  ) {
    throw new Error("Arc direction requires two to five phases.");
  }

  const arc = buildEnergyArc(direction.phases);

  if (arc.length !== trackCount) {
    throw new Error(`Phase track counts must total ${trackCount}.`);
  }

  return {
    playlistTitle: direction.playlistTitle.trim(),
    arcIntent: direction.arcIntent.trim(),
    phases: direction.phases,
    arc,
  };
}

export async function generateArcDirection({
  scenario,
  trackCount,
  model,
  client,
}) {
  if (typeof scenario !== "string" || scenario.trim() === "") {
    throw new Error("A listening scenario is required.");
  }

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: attempt === 1 ? 0.6 : 0.2,
        reasoning_effort: "low",
        include_reasoning: false,
        max_completion_tokens: 1200,
        messages: [
          {
            role: "user",
            content: buildArcPrompt({
              scenario,
              trackCount,
            }),
          },
        ],
      });

      const direction = parseArc(
        completion.choices?.[0]?.message?.content,
      );

      return validateArcDirection(direction, trackCount);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to generate a valid arc after two attempts: ${lastError.message}`,
  );
}
