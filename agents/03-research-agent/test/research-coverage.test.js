import test from "node:test";
import assert from "node:assert/strict";
import { validateResearchCoverage } from "../src/research-coverage.js";

const plan = {
  tasks: [
    { id: "T1", question: "What are the benefits?" },
    { id: "T2", question: "What are the customer outcomes?" },
    { id: "T3", question: "What are the security risks?" },
    { id: "T4", question: "What are the ethical risks?" },
  ],
};

test("accepts evidence covering enough planned tasks", () => {
  const result = validateResearchCoverage(plan, [
    { taskIds: ["T1"] },
    { taskIds: ["T2"] },
    { taskIds: ["T3"] },
  ]);
  assert.equal(result.requiredCoverage, 3);
  assert.deepEqual(result.coveredTaskIds, ["T1", "T2", "T3"]);
});

test("rejects a one-sided source collection", () => {
  assert.throws(
    () => validateResearchCoverage(plan, [
      { taskIds: ["T3"] },
      { taskIds: ["T3"] },
    ]),
    /covered only 1 of 4 planned tasks/,
  );
});
