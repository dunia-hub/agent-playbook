export const REQUIRED_SECTIONS = [
  "Contract Summary",
  "Important Functions",
  "Funds & State Flow",
  "Privileges",
  "Risk Flags",
];

export function validateResponse(response) {
  if (typeof response !== "string" || response.trim() === "") {
    throw new Error("The response is empty.");
  }

  const headingPattern = /^##\s+(.+?)\s*$/gm;
  const headingMatches = [...response.matchAll(headingPattern)];
  const headings = headingMatches.map((match) => match[1]);

  if (headings.length !== REQUIRED_SECTIONS.length) {
    throw new Error(
      `Expected exactly ${REQUIRED_SECTIONS.length} sections, but found ${headings.length}.`
    );
  }

  for (let index = 0; index < REQUIRED_SECTIONS.length; index += 1) {
    if (headings[index] !== REQUIRED_SECTIONS[index]) {
      throw new Error(
        `Expected section "${REQUIRED_SECTIONS[index]}" at position ${index + 1}.`
      );
    }
  }

  for (let index = 0; index < headingMatches.length; index += 1) {
    const heading = headings[index];
    const contentStart =
      headingMatches[index].index + headingMatches[index][0].length;

    const contentEnd =
      index + 1 < headingMatches.length
        ? headingMatches[index + 1].index
        : response.length;

    const content = response.slice(contentStart, contentEnd).trim();

    if (!content) {
      throw new Error(`Section "${heading}" has no content.`);
    }
  }

  return true;
}