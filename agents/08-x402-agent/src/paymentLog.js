import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export function createPaymentId(resourceUrl, requirement) {
  const identity = JSON.stringify({
    resourceUrl,
    scheme: requirement.scheme,
    network: requirement.network,
    asset: requirement.asset,
    amount: requirement.amount,
    payTo: String(requirement.payTo).toLowerCase(),
  });

  return createHash("sha256").update(identity).digest("hex");
}

export async function readPaymentRecords(logPath) {
  let content;

  try {
    content = await readFile(logPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return content
    .split("\n")
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(
          `Invalid payment log entry on line ${index + 1}.`,
        );
      }
    });
}

export async function appendPaymentRecord(logPath, record) {
  await mkdir(path.dirname(logPath), { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    ...record,
  };

  await appendFile(logPath, `${JSON.stringify(entry)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  return entry;
}

export async function hasBlockingPayment(logPath, paymentId) {
  const records = await readPaymentRecords(logPath);

  return records.some(
    (record) =>
      record.paymentId === paymentId &&
      ["settled", "pending"].includes(record.status),
  );
}
