import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateUsd,
  formatGwei,
  formatNative,
  formatUnits,
  parseUnsignedInteger,
} from "../src/units.js";

test("units: parses unsigned integer strings without precision loss", () => {
  assert.equal(parseUnsignedInteger("9007199254740993000", "value"), 9007199254740993000n);
});

test("units: rejects decimals, numbers, and negative values", () => {
  assert.throws(() => parseUnsignedInteger("1.5", "value"), /unsigned integer/);
  assert.throws(() => parseUnsignedInteger(10, "value"), /unsigned integer/);
  assert.throws(() => parseUnsignedInteger(-1n, "value"), /unsigned integer/);
});

test("units: formats gwei and native token values", () => {
  assert.equal(formatGwei(25_500_000_000n), "25.5");
  assert.equal(formatNative(1_250_000_000_000_000_000n), "1.25");
});

test("units: truncates display precision without floating point", () => {
  assert.equal(formatUnits(1_234_567n, 6, 3), "1.234");
});

test("units: calculates USD only when a manual price exists", () => {
  assert.equal(calculateUsd(1_000_000_000_000_000_000n, 2400), 2400);
  assert.equal(calculateUsd(1n, null), null);
});
