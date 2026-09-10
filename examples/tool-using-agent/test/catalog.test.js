import test from "node:test";
import assert from "node:assert/strict";
import { validateCatalog } from "../src/catalog.js";

const workshop = { id: "01-agent", title: "First Agent", date: "2026-09-14", format: "Online" };

test("catalog: validates a workshop catalog", () => {
  assert.equal(validateCatalog({ workshops: [workshop] }).workshops.length, 1);
});

test("catalog: rejects empty catalogs and duplicate IDs", () => {
  assert.throws(() => validateCatalog({ workshops: [] }), /at least one/);
  assert.throws(() => validateCatalog({ workshops: [workshop, workshop] }), /Duplicate/);
});

test("catalog: rejects incomplete workshops", () => {
  assert.throws(() => validateCatalog({ workshops: [{ ...workshop, date: "" }] }), /date/);
});
