import test from "node:test";
import assert from "node:assert/strict";

import { validateFindingCoverage } from "../src/finding-coverage.js";

const plan = {
  tasks: [
    { id: "T1", question: "What are the benefits?" },
    { id: "T2", question: "What are the risks?" },
  ],
};

test("accepts verified findings that answer every planned task", () => {
  const result = validateFindingCoverage(plan, {
    sourceAssessments: [
      { findings: [{ taskIds: ["T1"] }] },
      { findings: [{ taskIds: ["T2"] }] },
    ],
  });

  assert.deepEqual(result.coveredTaskIds, ["T1", "T2"]);
  assert.equal(result.complete, true);
});

test("marks a benefits-and-risks analysis partial when risks are missing", () => {
  const result = validateFindingCoverage(plan, {
    sourceAssessments: [
      { findings: [{ taskIds: ["T1"] }] },
      { findings: [{ taskIds: ["T1"] }] },
    ],
  });

  assert.equal(result.complete, false);
  assert.deepEqual(result.coveredTaskIds, ["T1"]);
  assert.deepEqual(result.missingTasks, [
    { id: "T2", question: "What are the risks?" },
  ]);
});
