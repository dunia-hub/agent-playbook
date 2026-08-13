import test from "node:test";
import assert from "node:assert/strict";
import {
  REQUIRED_SECTIONS,
  validateResponse,
} from "../src/validator.js";

const validResponse = `
## Contract Summary
The contract stores ETH deposited by users.

## Important Functions
The deposit function accepts ETH.

## Funds & State Flow
The balances mapping increases when a user deposits.

## Privileges
No owner or administrator is defined in the supplied code.

## Risk Flags
The withdraw function makes an external call after reducing the stored balance.
`.trim();

test("accepts a response with exactly the five required sections", () => {
  assert.equal(validateResponse(validResponse), true);
});

test("defines the required sections in the expected order", () => {
  assert.deepEqual(REQUIRED_SECTIONS, [
    "Contract Summary",
    "Important Functions",
    "Funds & State Flow",
    "Privileges",
    "Risk Flags",
  ]);
});

test("rejects a response with a missing section", () => {
  const response = validResponse.replace(
    "## Risk Flags\nThe withdraw function makes an external call after reducing the stored balance.",
    ""
  );

  assert.throws(
    () => validateResponse(response),
    /Expected exactly 5 sections/
  );
});

test("rejects a response with an extra section", () => {
  const response = `${validResponse}\n\n## Conclusion\nExtra content.`;

  assert.throws(
    () => validateResponse(response),
    /Expected exactly 5 sections/
  );
});

test("rejects sections in the wrong order", () => {
  const response = validResponse
    .replace("## Contract Summary", "## TEMP")
    .replace("## Important Functions", "## Contract Summary")
    .replace("## TEMP", "## Important Functions");

  assert.throws(
    () => validateResponse(response),
    /Expected section "Contract Summary" at position 1/
  );
});

test("rejects an empty section", () => {
  const response = validResponse.replace(
    "## Privileges\nNo owner or administrator is defined in the supplied code.",
    "## Privileges"
  );

  assert.throws(
    () => validateResponse(response),
    /Section "Privileges" has no content/
  );
});

test("rejects an empty response", () => {
  assert.throws(
    () => validateResponse(""),
    /The response is empty/
  );
});