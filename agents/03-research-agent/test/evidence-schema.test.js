import test from "node:test";
import assert from "node:assert/strict";

import { EVIDENCE_RESPONSE_FORMAT } from "../src/evidence-schema.js";

function assertStrictObjects(schema) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type === "object") {
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(
      [...schema.required].sort(),
      Object.keys(schema.properties).sort(),
    );
  }

  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) {
      value.forEach(assertStrictObjects);
    } else {
      assertStrictObjects(value);
    }
  }
}

test("uses Groq strict JSON Schema mode for evidence analysis", () => {
  assert.equal(EVIDENCE_RESPONSE_FORMAT.type, "json_schema");
  assert.equal(EVIDENCE_RESPONSE_FORMAT.json_schema.strict, true);
  assertStrictObjects(EVIDENCE_RESPONSE_FORMAT.json_schema.schema);
});
