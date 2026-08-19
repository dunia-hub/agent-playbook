import { writeFile } from "node:fs/promises";
import {
  generatePrivateKey,
  privateKeyToAccount,
} from "viem/accounts";

const payerPrivateKey = generatePrivateKey();
const receiverPrivateKey = generatePrivateKey();

const payer = privateKeyToAccount(payerPrivateKey);
const receiver = privateKeyToAccount(receiverPrivateKey);

const env = `# Disposable Base Sepolia workshop wallets only
# Never fund these wallets with real assets.
EVM_PRIVATE_KEY=${payerPrivateKey}
TEST_RECEIVER_PRIVATE_KEY=${receiverPrivateKey}

X402_RESOURCE_URL=http://localhost:4021/weather
X402_MAX_PAYMENT_USD=0.10
X402_ALLOWED_NETWORKS=eip155:84532
X402_ALLOWED_ASSETS=USDC
X402_ALLOWED_RECIPIENTS=${receiver.address}
X402_AUTO_APPROVE=false
X402_LOG_PATH=./data/payments.jsonl

X402_SERVER_PAY_TO=${receiver.address}
X402_SERVER_PORT=4021
`;

try {
  await writeFile(".env", env, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
} catch (error) {
  if (error.code === "EEXIST") {
    throw new Error(
      ".env already exists. It was not overwritten.",
    );
  }

  throw error;
}

console.log("Disposable workshop wallets created.");
console.log(`Payer: ${payer.address}`);
console.log(`Receiver: ${receiver.address}`);
console.log("Private keys were written only to .env.");
