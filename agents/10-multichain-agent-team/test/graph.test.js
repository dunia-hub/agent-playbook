import test from "node:test";
import assert from "node:assert/strict";
import { topologicalOrder } from "../src/graph.js";

test("graph: orders dependencies before dependants", () => {
  const order = topologicalOrder([
    { id: "third", dependsOn: ["second"] },
    { id: "first", dependsOn: [] },
    { id: "second", dependsOn: ["first"] },
  ]);
  assert.deepEqual(order, ["first", "second", "third"]);
});

test("graph: preserves independent input order", () => {
  assert.deepEqual(
    topologicalOrder([
      { id: "one", dependsOn: [] },
      { id: "two", dependsOn: [] },
    ]),
    ["one", "two"]
  );
});

test("graph: rejects dependency cycles", () => {
  assert.throws(
    () =>
      topologicalOrder([
        { id: "one", dependsOn: ["two"] },
        { id: "two", dependsOn: ["one"] },
      ]),
    /Dependency cycle/
  );
});

test("graph: rejects unknown dependencies", () => {
  assert.throws(
    () => topologicalOrder([{ id: "one", dependsOn: ["missing"] }]),
    /Unknown dependency/
  );
});
