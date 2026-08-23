const ROLES = [
  "opening",
  "build",
  "peak",
  "bridge",
  "release",
  "landing",
];

function responseFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "spotify_search_plan",
      strict: true,
      schema: {
        type: "object",
        properties: {
          plans: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: {
                  type: "string",
                },
                queries: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                genres: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                languages: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                role: {
                  type: "string",
                  enum: ROLES,
                },
                allowExplicit: {
                  type: "boolean",
                },
              },
              required: [
                "phase",
                "queries",
                "genres",
                "languages",
                "role",
                "allowExplicit",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["plans"],
        additionalProperties: false,
      },
    },
  };
}

function buildPrompt({ scenario, direction }) {
  return `
You are planning Spotify catalogue searches for a playlist.

LISTENING SCENARIO
${JSON.stringify(scenario)}

PLAYLIST ARC
${JSON.stringify(direction)}

Create one search plan for every supplied phase.

RULES

1. Do not propose track titles.
2. Do not propose artist names.
3. Each plan must use the phase name exactly as supplied.
4. Provide two to four concise Spotify search queries per phase.
5. Queries may combine genres, regions, languages, eras or moods.
6. Queries should be broad enough to return multiple real recordings.
7. Use different search angles across the phases.
8. Infer whether explicit tracks are acceptable from the scenario.
9. Languages may be an empty array when no language matters.
10. Genres must contain at least one useful catalogue genre.

Good queries:
- Kenyan afro-pop
- Swahili soul
- Ghanaian highlife
- South African amapiano
- 1980s African funk

Bad queries:
- A specific song title
- A specific artist name
- Long descriptions of the user's situation

Return only the structured search plan.
`.trim();
}

function validateSearchPlan(payload, direction) {
  if (!Array.isArray(payload?.plans)) {
    throw new Error(
      "Search-plan response must contain a plans array.",
    );
  }

  const expectedPhases = new Set(
    direction.phases.map((phase) =>
      phase.name.trim().toLowerCase(),
    ),
  );

  const seenPhases = new Set();

  for (const plan of payload.plans) {
    const phase = plan.phase.trim().toLowerCase();

    if (!expectedPhases.has(phase)) {
      throw new Error(
        `Search plan contains an unknown phase: ${plan.phase}.`,
      );
    }

    if (seenPhases.has(phase)) {
      throw new Error(
        `Search plan repeats phase: ${plan.phase}.`,
      );
    }

    if (
      !Array.isArray(plan.queries) ||
      plan.queries.length === 0 ||
      plan.queries.some(
        (query) =>
          typeof query !== "string" ||
          query.trim() === "",
      )
    ) {
      throw new Error(
        `Search plan for ${plan.phase} requires queries.`,
      );
    }

    if (
      !Array.isArray(plan.genres) ||
      plan.genres.length === 0
    ) {
      throw new Error(
        `Search plan for ${plan.phase} requires genres.`,
      );
    }

    seenPhases.add(phase);
  }

  for (const phase of expectedPhases) {
    if (!seenPhases.has(phase)) {
      throw new Error(
        `Search plan is missing phase: ${phase}.`,
      );
    }
  }

  return payload.plans;
}

export async function generateSearchPlan({
  scenario,
  direction,
  model,
  client,
}) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    reasoning_effort: "low",
    include_reasoning: false,
    max_completion_tokens: 1600,
    response_format: responseFormat(),
    messages: [
      {
        role: "user",
        content: buildPrompt({
          scenario,
          direction: {
            arcIntent: direction.arcIntent,
            phases: direction.phases,
          },
        }),
      },
    ],
  });

  const content =
    completion.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content === "") {
    throw new Error("Groq returned an empty search plan.");
  }

  return validateSearchPlan(
    JSON.parse(content),
    direction,
  );
}
