const STOP_WORDS = new Set(["a", "all", "an", "and", "is", "the", "when", "where", "workshop"]);

function words(value) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export const tools = {
  list_workshops: {
    description: "List every workshop in the local catalog.",
    run(_arguments, catalog) {
      return { workshops: catalog.workshops };
    },
  },
  find_workshop: {
    description: "Find the workshop that best matches a search query.",
    run({ query }, catalog) {
      const queryWords = words(query).filter((word) => !STOP_WORDS.has(word));
      const ranked = catalog.workshops
        .map((workshop) => ({
          workshop,
          score: queryWords.filter((word) => words(`${workshop.id} ${workshop.title}`).includes(word)).length,
        }))
        .sort((left, right) => right.score - left.score);
      return { workshop: ranked[0]?.score > 0 ? ranked[0].workshop : null };
    },
  },
};

export function callTool(name, arguments_, catalog) {
  const tool = tools[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.run(arguments_, catalog);
}
