import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  appendPaymentRecord,
  createPaymentId,
  hasBlockingPayment,
  readPaymentRecords,
} from "../src/paymentLog.js";

const requirement = {
  scheme: "exact",
  network: "eip155:84532",
  asset: "USDC",
  amount: "10000",
  payTo: "0x1111111111111111111111111111111111111111",
};

test("creates a stable payment ID from the resource and terms", () => {
  const first = createPaymentId(
    "https://example.com/weather",
    requirement,
  );
  const second = createPaymentId(
    "https://example.com/weather",
    requirement,
  );

  assert.equal(first, second);
  assert.equal(first.length, 64);
});

test("changes the payment ID when payment terms change", () => {
  const first = createPaymentId(
    "https://example.com/weather",
    requirement,
  );
  const second = createPaymentId(
    "https://example.com/weather",
    { ...requirement, amount: "20000" },
  );

  assert.notEqual(first, second);
});

test("writes and reads JSONL payment records", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "x402-log-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));

  const logPath = path.join(directory, "payments.jsonl");
  const written = await appendPaymentRecord(logPath, {
    paymentId: "payment-1",
    status: "attempted",
  });
  const records = await readPaymentRecords(logPath);

  assert.equal(records.length, 1);
  assert.equal(records[0].paymentId, "payment-1");
  assert.equal(records[0].status, "attempted");
  assert.equal(records[0].timestamp, written.timestamp);
});

test("blocks a previously settled payment", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "x402-log-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));

  const logPath = path.join(directory, "payments.jsonl");

  await appendPaymentRecord(logPath, {
    paymentId: "payment-2",
    status: "settled",
  });

  assert.equal(
    await hasBlockingPayment(logPath, "payment-2"),
    true,
  );
  assert.equal(
    await hasBlockingPayment(logPath, "different-payment"),
    false,
  );
});

test("returns an empty list when no payment log exists", async () => {
  const logPath = path.join(
    os.tmpdir(),
    `missing-x402-log-${Date.now()}.jsonl`,
  );

  assert.deepEqual(await readPaymentRecords(logPath), []);
});

test("rejects a corrupted payment log", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "x402-log-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));

  const logPath = path.join(directory, "payments.jsonl");
  await writeFile(logPath, "not-json\n", "utf8");

  await assert.rejects(
    readPaymentRecords(logPath),
    /Invalid payment log entry on line 1/,
  );
});

test("blocks retry while a settlement is pending", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "x402-log-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));

  const logPath = path.join(directory, "payments.jsonl");

  await appendPaymentRecord(logPath, {
    paymentId: "payment-pending",
    status: "pending",
    transaction: "0xpending",
  });

  assert.equal(
    await hasBlockingPayment(logPath, "payment-pending"),
    true,
  );
});
