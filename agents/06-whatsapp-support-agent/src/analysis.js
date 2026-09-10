const URGENCIES = new Set(["low", "normal", "high", "critical"]);
const ANALYSIS_KEYS = ["language", "confidence", "intent", "searchTerms", "urgency"];

export function parseModelJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Groq returned an empty analysis.");
  }
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    throw new Error("Groq analysis is not valid JSON.");
  }
}

export function validateAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
    throw new Error("Message analysis must be a JSON object.");
  }
  const missing = ANALYSIS_KEYS.filter((key) => !(key in analysis));
  const extra = Object.keys(analysis).filter((key) => !ANALYSIS_KEYS.includes(key));
  if (missing.length) throw new Error(`Message analysis is missing: ${missing.join(", ")}.`);
  if (extra.length) throw new Error(`Message analysis has unsupported keys: ${extra.join(", ")}.`);
  if (typeof analysis.language !== "string" || !/^[a-z]{2,3}$/.test(analysis.language)) {
    throw new Error("language must be a lowercase ISO language code.");
  }
  if (
    typeof analysis.confidence !== "number" ||
    analysis.confidence < 0 ||
    analysis.confidence > 1
  ) {
    throw new Error("confidence must be a number from 0 to 1.");
  }
  if (typeof analysis.intent !== "string" || !analysis.intent.trim()) {
    throw new Error("intent must be a non-empty string.");
  }
  if (!Array.isArray(analysis.searchTerms) || analysis.searchTerms.length > 6) {
    throw new Error("searchTerms must be an array with at most 6 items.");
  }
  if (
    analysis.searchTerms.some(
      (term) => typeof term !== "string" || !term.trim() || term.length > 80
    )
  ) {
    throw new Error("Every search term must be a non-empty string of at most 80 characters.");
  }
  if (!URGENCIES.has(analysis.urgency)) {
    throw new Error("urgency must be low, normal, high, or critical.");
  }

  return {
    ...analysis,
    intent: analysis.intent.trim(),
    searchTerms: analysis.searchTerms.map((term) => term.trim()),
  };
}
