import test from "node:test";
import assert from "node:assert/strict";
import { callTool } from "../src/tools.js";

const catalog = { workshops: [
  { id: "01-untangle-agent", title: "Untangle Agent", date: "2026-09-14", format: "Online" },
  { id: "02-contract-reader", title: "Smart Contract Reader", date: "2026-09-15", format: "Online" },
] };

test("tools: lists workshops", () => {
  assert.equal(callTool("list_workshops", {}, catalog).workshops.length, 2);
});

test("tools: finds a workshop using catalog words", () => {
  assert.equal(callTool("find_workshop", { query: "contract reader" }, catalog).workshop.id, "02-contract-reader");
});

test("tools: returns null rather than guessing", () => {
  assert.equal(callTool("find_workshop", { query: "cooking" }, catalog).workshop, null);
});

test("tools: rejects unregistered tools", () => {
  assert.throws(() => callTool("delete_calendar", {}, catalog), /Unknown tool/);
});
