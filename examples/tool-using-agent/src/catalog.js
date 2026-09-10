export function validateCatalog(value) {
  if (!value || !Array.isArray(value.workshops) || value.workshops.length === 0) {
    throw new Error("Catalog must contain at least one workshop.");
  }
  const ids = new Set();
  for (const workshop of value.workshops) {
    for (const key of ["id", "title", "date", "format"]) {
      if (typeof workshop[key] !== "string" || workshop[key].trim() === "") {
        throw new Error(`Workshop ${key} must be a non-empty string.`);
      }
    }
    if (ids.has(workshop.id)) throw new Error(`Duplicate workshop ID: ${workshop.id}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workshop.date) || Number.isNaN(Date.parse(`${workshop.date}T00:00:00Z`))) {
      throw new Error(`Workshop ${workshop.id} has an invalid date.`);
    }
    ids.add(workshop.id);
  }
  return value;
}
