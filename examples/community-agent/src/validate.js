const KEYS = ["name", "slug", "purpose", "runCommand", "testCommand", "safety", "externalServices"];

export function validateSubmission(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Submission must be a JSON object.");
  }
  const missing = KEYS.filter((key) => !(key in value));
  const extra = Object.keys(value).filter((key) => !KEYS.includes(key));
  if (missing.length) throw new Error(`Submission is missing: ${missing.join(", ")}.`);
  if (extra.length) throw new Error(`Submission has unsupported keys: ${extra.join(", ")}.`);

  for (const key of ["name", "slug", "purpose", "runCommand", "testCommand"]) {
    if (typeof value[key] !== "string") throw new Error(`${key} must be a string.`);
  }
  for (const key of ["safety", "externalServices"]) {
    if (!Array.isArray(value[key]) || value[key].some((item) => typeof item !== "string")) {
      throw new Error(`${key} must be an array of strings.`);
    }
  }
  return value;
}
