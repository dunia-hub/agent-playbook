import path from "node:path";

function parseList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value, name) {
  if (value === undefined || value === "") {
    return false;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be true or false.`);
}

export function loadConfig(env = process.env) {
  const maxPaymentUsd = Number(env.X402_MAX_PAYMENT_USD ?? "0.10");
  const allowedNetworks = parseList(
    env.X402_ALLOWED_NETWORKS ?? "eip155:84532",
  );
  const allowedAssets = parseList(env.X402_ALLOWED_ASSETS ?? "USDC");
  const allowedRecipients = parseList(env.X402_ALLOWED_RECIPIENTS);
  const autoApprove = parseBoolean(
    env.X402_AUTO_APPROVE,
    "X402_AUTO_APPROVE",
  );

  if (!Number.isFinite(maxPaymentUsd) || maxPaymentUsd <= 0) {
    throw new Error("X402_MAX_PAYMENT_USD must be a positive number.");
  }

  if (allowedNetworks.length === 0) {
    throw new Error("X402_ALLOWED_NETWORKS must contain at least one network.");
  }

  if (allowedAssets.length === 0) {
    throw new Error("X402_ALLOWED_ASSETS must contain at least one asset.");
  }

  if (autoApprove && allowedRecipients.length === 0) {
    throw new Error(
      "X402_AUTO_APPROVE requires at least one X402_ALLOWED_RECIPIENTS address.",
    );
  }

  if (
    env.EVM_PRIVATE_KEY &&
    !/^0x[0-9a-fA-F]{64}$/.test(env.EVM_PRIVATE_KEY)
  ) {
    throw new Error(
      "EVM_PRIVATE_KEY must be a 0x-prefixed 32-byte private key.",
    );
  }

  return {
    resourceUrl: env.X402_RESOURCE_URL?.trim() || null,
    evmPrivateKey: env.EVM_PRIVATE_KEY?.trim() || null,
    maxPaymentUsd,
    allowedNetworks,
    allowedAssets,
    allowedRecipients,
    autoApprove,
    logPath: path.resolve(
      env.X402_LOG_PATH?.trim() || "./data/payments.jsonl",
    ),
  };
}
