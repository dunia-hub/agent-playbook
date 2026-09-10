import test from "node:test";
import assert from "node:assert/strict";
import { formatUnits, parseUnits } from "../src/units.js";

test("units: parses EVM decimal amounts exactly", () => {
  assert.equal(parseUnits("0.002", 18), 2_000_000_000_000_000n);
});

test("units: parses Solana and Stellar units", () => {
  assert.equal(parseUnits("0.1", 9), 100_000_000n);
  assert.equal(parseUnits("5", 7), 50_000_000n);
});

test("units: rejects numbers and negative amounts", () => {
  assert.throws(() => parseUnits(1, 9), /decimal string/);
  assert.throws(() => parseUnits("-1", 9), /decimal string/);
});

test("units: rejects excess precision", () => {
  assert.throws(() => parseUnits("0.00000001", 7), /more than 7/);
});

test("units: formats integer units without floating point", () => {
  assert.equal(formatUnits(2_000_000_000_000_000n, 18), "0.002");
  assert.equal(formatUnits(50_000_000n, 7), "5");
});
