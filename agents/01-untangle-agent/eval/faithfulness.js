#!/usr/bin/env node
// Faithfulness evaluation script for the Untangle Agent.
// Checks that the agent's output stays true to the input without inventing facts.
import { readFile } from 'node:fs/promises';
import { validateResponse } from '../src/validate.js';

/**
 * Extract all "facts" from the input text: numbers, dates, names, venues, etc.
 * This is a simple heuristic-based extractor for evaluation purposes.
 */
function extractFacts(text) {
  const facts = {
    numbers: [],
    dates: [],
    names: [],
    venues: [],
    budgets: [],
    all: [],
  };

  // Numbers (including currency-like patterns)
  const numberMatches = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
  facts.numbers = [...new Set(numberMatches)];

  // Currency patterns
  const budgetMatches = text.match(/\$[\d,]+(?:\.\d+)?|\b\d+k\b|\b\d+ dollars?\b/gi) || [];
  facts.budgets = [...new Set(budgetMatches)];

  // Date-like patterns
  const dateMatches = text.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b(?:next|this)\s+(?:month|week|quarter|year)\b|\bQ[1-4]\b/gi
  ) || [];
  facts.dates = [...new Set(dateMatches)];

  // Names (capitalized words that look like person names)
  const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
  // Filter out common non-name capitalized words
  const stopWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
    'December', 'AI', 'HR', 'CEO', 'MC', 'UTC', 'GMT',
  ]);
  facts.names = nameMatches.filter((n) => !stopWords.has(n) && n.length > 2);

  // Venues / locations
  const venueMatches = text.match(
    /\b(?:venue|hotel|airbnb|villa|office|space|center|centre|building|room|location|place|beach|mountain|city|airport|downtown)\b/gi
  ) || [];
  facts.venues = [...new Set(venueMatches)];

  facts.all = [
    ...facts.numbers,
    ...facts.dates,
    ...facts.names,
    ...facts.venues,
    ...facts.budgets,
  ];

  return facts;
}

/**
 * Check if the output contains any facts that don't appear in the input.
 */
function checkInventedFacts(inputText, outputText) {
  const inputFacts = extractFacts(inputText);
  const issues = [];

  // Check for numbers in output that aren't in input
  const outputNumbers = outputText.match(/\b\d+(?:\.\d+)?\b/g) || [];
  for (const num of outputNumbers) {
    if (!inputFacts.numbers.includes(num)) {
      issues.push(`Possible invented number: "${num}"`);
    }
  }

  // Check for dates in output that aren't in input
  const outputDates = outputText.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b(?:next|this)\s+(?:month|week|quarter|year)\b|\bQ[1-4]\b/gi
  ) || [];
  for (const date of outputDates) {
    if (!inputFacts.dates.some((d) => d.toLowerCase() === date.toLowerCase())) {
      issues.push(`Possible invented date: "${date}"`);
    }
  }

  // Check for names in output that aren't in input
  const outputNames = outputText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
  const stopWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
    'December', 'AI', 'HR', 'CEO', 'MC', 'UTC', 'GMT', 'Tasks', 'Grouped',
    'Ideas', 'Priorities', 'Missing', 'Info', 'Next', 'Steps', 'Decisions',
    'Already', 'Made', 'Contradictions',
  ]);
  for (const name of outputNames) {
    if (!stopWords.has(name) && name.length > 2) {
      if (!inputFacts.names.some((n) => n === name)) {
        issues.push(`Possible invented name: "${name}"`);
      }
    }
  }

  return issues;
}

/**
 * Check that uncertainty markers are preserved.
 */
function checkUncertaintyPreserved(inputText, outputText) {
  const issues = [];
  const uncertaintyMarkers = ['maybe', 'might', 'could', 'possibly', 'not sure', '?', 'unclear', 'fuzzy', 'TBD'];

  // Find uncertain statements in input
  const inputLower = inputText.toLowerCase();
  const uncertainInputs = [];
  for (const marker of uncertaintyMarkers) {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const matches = inputText.match(regex) || [];
    uncertainInputs.push(...matches);
  }

  // Check if output still contains these markers (they shouldn't be removed)
  const outputLower = outputText.toLowerCase();
  for (const marker of uncertainInputs) {
    if (!outputLower.includes(marker.toLowerCase())) {
      issues.push(`Uncertainty marker "${marker}" may have been removed from output`);
    }
  }

  return issues;
}

/**
 * Run the full faithfulness evaluation.
 */
export async function evaluateFaithfulness(inputPath, outputPath) {
  const [inputText, outputText] = await Promise.all([
    readFile(inputPath, 'utf-8'),
    readFile(outputPath, 'utf-8'),
  ]);

  const validation = validateResponse(outputText);
  const inventedFacts = checkInventedFacts(inputText, outputText);
  const uncertaintyIssues = checkUncertaintyPreserved(inputText, outputText);

  const allIssues = [
    ...(!validation.valid ? ['Structure validation failed'] : []),
    ...validation.errors.map((e) => `Validation: ${e}`),
    ...inventedFacts,
    ...uncertaintyIssues,
  ];

  const score = allIssues.length === 0 ? 100 : Math.max(0, 100 - allIssues.length * 10);

  return {
    score,
    passed: allIssues.length === 0,
    issues: allIssues,
    details: {
      inputLength: inputText.length,
      outputLength: outputText.length,
      validation,
      inventedFacts,
      uncertaintyIssues,
    },
  };
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node eval/faithfulness.js <input.txt> <output.md>');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  const result = await evaluateFaithfulness(inputPath, outputPath);

  console.log(`\nFaithfulness Evaluation`);
  console.log(`======================`);
  console.log(`Score: ${result.score}/100`);
  console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);

  if (result.issues.length > 0) {
    console.log(`\nIssues found:`);
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }

  console.log(`\nDetails:`);
  console.log(`  Input length: ${result.details.inputLength} chars`);
  console.log(`  Output length: ${result.details.outputLength} chars`);
  console.log(`  Validation valid: ${result.details.validation.valid}`);

  process.exit(result.passed ? 0 : 1);
}

main();
