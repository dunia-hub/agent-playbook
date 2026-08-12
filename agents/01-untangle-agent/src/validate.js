// Validates that a response contains all five required sections as level-2
// headings, in the required order. Returns a result object; never throws.
import { REQUIRED_SECTIONS } from './prompt.js';

export function validateResponse(text) {
  const errors = [];

  if (typeof text !== 'string' || text.trim() === '') {
    return { valid: false, errors: ['Response is empty.'] };
  }

  // Find the line index of each required "## Section" heading.
  const lines = text.split('\n');
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

  return { valid: errors.length === 0, errors };
}
