import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadConfig } from "./config.js";
import { discoverPaymentRequirements } from "./discover.js";
import { createEvmPaymentClient } from "./paymentClient.js";
import {
  evaluatePaymentRequirements,
  formatPaymentAmount,
} from "./policy.js";

async function printResource(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  console.log("\n## Resource Received");
  console.log(`Status: ${response.status}`);

  if (!body) {
    console.log("(empty response body)");
    return;
  }

  if (contentType.includes("application/json")) {
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
      return;
    } catch {
      // Print the original body if it is not valid JSON.
    }
  }

  console.log(body);
}

function printPaymentOptions(paymentRequired, config) {
  const evaluations = evaluatePaymentRequirements(
    paymentRequired.accepts,
    config,
  );

  console.log("\n## Payment Required");
  console.log(
    `Resource: ${paymentRequired.resource?.description ?? paymentRequired.resource?.url ?? "Unknown"}`,
  );

  for (const [index, result] of evaluations.entries()) {
    const requirement = result.requirement;

    console.log(`\nOption ${index + 1}`);
    console.log(`Amount: ${formatPaymentAmount(requirement)}`);
    console.log(`Network: ${requirement.network}`);
    console.log(`Asset: ${result.assetSymbol ?? requirement.asset}`);
    console.log(`Recipient: ${requirement.payTo}`);
    console.log(`Scheme: ${requirement.scheme}`);
    console.log(`Policy: ${result.allowed ? "Allowed" : "Blocked"}`);

    for (const reason of result.reasons) {
      console.log(`Reason: ${reason}`);
    }
  }

  return evaluations;
}

async function askForApproval(context) {
  const requirement = context.selectedRequirements;
  const readline = createInterface({ input, output });

  console.log("\n## Final Approval");
  console.log(`Amount: ${formatPaymentAmount(requirement)}`);
  console.log(`Network: ${requirement.network}`);
  console.log(`Recipient: ${requirement.payTo}`);

  const answer = await readline.question(
    'Type PAY to approve this exact payment: ',
  );

  readline.close();

  return answer.trim() === "PAY";
}

async function main() {
  const config = loadConfig();
  const resourceUrl = process.argv[2] ?? config.resourceUrl;

  if (!resourceUrl) {
    throw new Error(
      "Provide a resource URL: npm start -- https://example.com/paid-resource",
    );
  }

  console.log("## x402 Pay Per Call Agent");
  console.log(`Resource: ${resourceUrl}`);
  console.log(`Maximum payment: $${config.maxPaymentUsd}`);
  console.log(
    `Allowed networks: ${config.allowedNetworks.join(", ")}`,
  );
  console.log(`Automatic approval: ${config.autoApprove}`);

  console.log("\nDiscovering payment requirements...");

  const discovery = await discoverPaymentRequirements(resourceUrl);

  if (!discovery.requiresPayment) {
    console.log("\nNo x402 payment is required.");
    await printResource(discovery.response);
    return;
  }

  const evaluations = printPaymentOptions(
    discovery.paymentRequired,
    config,
  );
  const allowedOptions = evaluations.filter(
    (result) => result.allowed,
  );

  if (allowedOptions.length === 0) {
    throw new Error(
      "Every payment option was blocked by the configured safety policy.",
    );
  }

  if (!config.evmPrivateKey) {
    throw new Error(
      "Payment requirements were discovered safely, but EVM_PRIVATE_KEY is missing. Add a Base Sepolia test-wallet key to .env before paying.",
    );
  }

  if (config.autoApprove) {
    console.log(
      "\nAutomatic approval is enabled for the configured recipient allowlist.",
    );
  }

  const paymentClient = createEvmPaymentClient(config, {
    approvePayment: askForApproval,
  });

  console.log(`Payer: ${paymentClient.signerAddress}`);

  const paidResponse = await paymentClient.fetchWithPayment(resourceUrl);

  if (!paidResponse.ok) {
    const failureBody = await paidResponse.text();
    const details = failureBody
      ? ` Response: ${failureBody.slice(0, 500)}`
      : "";

    throw new Error(
      `The paid request failed with HTTP ${paidResponse.status}.${details}`,
    );
  }

  await printResource(paidResponse);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
});
