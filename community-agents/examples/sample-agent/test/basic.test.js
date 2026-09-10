import test from "node:test";
import assert from "node:assert/strict";

test("sample fixture is intentionally minimal", () => {
  assert.equal("hello community".toUpperCase(), "HELLO COMMUNITY");
});
