import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEvmAddress,
  isValidSolanaAddress,
  isValidStellarAddress,
} from "../src/addresses.js";

test("addresses: validates EVM addresses", () => {
  assert.equal(isValidEvmAddress("0x1111111111111111111111111111111111111111"), true);
  assert.equal(isValidEvmAddress("0x1234"), false);
  assert.equal(isValidEvmAddress("1111111111111111111111111111111111111111"), false);
});

test("addresses: validates decoded 32-byte Solana addresses", () => {
  assert.equal(
    isValidSolanaAddress("4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw"),
    true
  );
  assert.equal(isValidSolanaAddress("not-a-solana-address"), false);
});

test("addresses: accepts the 32-byte all-zero Solana address", () => {
  assert.equal(isValidSolanaAddress("11111111111111111111111111111111"), true);
});

test("addresses: validates Stellar StrKey version and checksum", () => {
  assert.equal(
    isValidStellarAddress("GD7757P47P5PT6HX6327J47S6HYO73XN5TV6V2PI47TOLZHD4LQ6AE5T"),
    true
  );
});

test("addresses: rejects corrupted Stellar addresses", () => {
  assert.equal(
    isValidStellarAddress("GD7757P47P5PT6HX6327J47S6HYO73XN5TV6V2PI47TOLZHD4LQ6AE5A"),
    false
  );
  assert.equal(isValidStellarAddress("S".repeat(56)), false);
});
