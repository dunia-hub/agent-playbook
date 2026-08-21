// Validates that a response contains all five required sections as level-2
// headings, in the required order, and that each section has at least one bullet.
// Returns a result object; never throws.
import { REQUIRED_SECTIONS } from './prompt.js';

export function validateResponse(text) {
  const errors = [];

  if (typeof text !== 'string' || text.trim() === '') {
    return { valid: false, errors: ['Response is empty.'] };
  }

  const lines = text.split('\n');

  // Find the line index of each required "## Section" heading.
  const positions = {};
  for (const section of REQUIRED_SECTIONS) {
    const heading = `## ${section}`;
    const idx = lines.findIndex((line) => line.trim() === heading);
    positions[section] = idx;
    if (idx === -1) {
      errors.push(`Missing section heading: "## ${section}"`);
    }
  }

  // Only check ordering if every section was actually found.
  const allFound = REQUIRED_SECTIONS.every((s) => positions[s] !== -1);
  if (allFound) {
    for (let i = 1; i < REQUIRED_SECTIONS.length; i++) {
      const prev = REQUIRED_SECTIONS[i - 1];
      const curr = REQUIRED_SECTIONS[i];
      if (positions[curr] < positions[prev]) {
        errors.push(`Section "${curr}" appears before "${prev}" (wrong order).`);
      }
    }
  }

  // Check that each found section has at least one bullet.
  if (allFound) {
    for (const section of REQUIRED_SECTIONS) {
      const startIdx = positions[section];
      // Find the next section heading or end of text.
      const sectionIdx = REQUIRED_SECTIONS.indexOf(section);
      let endIdx = lines.length;
      if (sectionIdx < REQUIRED_SECTIONS.length - 1) {
        const nextSection = REQUIRED_SECTIONS[sectionIdx + 1];
        const nextHeadingIdx = lines.findIndex(
          (line, i) => i > startIdx && line.trim() === `## ${nextSection}`
        );
        if (nextHeadingIdx !== -1) {
          endIdx = nextHeadingIdx;
        }
      }
      const sectionLines = lines.slice(startIdx + 1, endIdx);
      const hasBullet = sectionLines.some(
        (line) => /^\s*[-*]\s/.test(line.trim())
      );
      if (!hasBullet) {
        errors.push(`Section "${section}" has no bullet points.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
