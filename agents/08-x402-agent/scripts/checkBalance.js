import "dotenv/config";
import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  avalancheFuji,
  baseSepolia,
} from "viem/chains";
import { getDefaultAsset } from "../src/assets.js";

const payerPrivateKey = process.env.EVM_PRIVATE_KEY;

const facilitatorPrivateKey =
  process.env.X402_FACILITATOR_PRIVATE_KEY ??
  process.env.TEST_RECEIVER_PRIVATE_KEY;

function requirePrivateKey(privateKey, name) {
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      `${name} must contain a disposable EVM test-wallet private key.`,
    );
  }

  return privateKeyToAccount(privateKey);
}

const payer = requirePrivateKey(
  payerPrivateKey,
  "EVM_PRIVATE_KEY",
);

const facilitator = requirePrivateKey(
  facilitatorPrivateKey,
  "X402_FACILITATOR_PRIVATE_KEY",
);

const networks = [
  {
    name: "Base Sepolia",
    network: "eip155:84532",
    nativeSymbol: "ETH",
    chain: baseSepolia,
    rpcUrl:
      process.env.BASE_SEPOLIA_RPC_URL ??
      "https://sepolia.base.org",
  },
  {
    name: "Avalanche Fuji",
    network: "eip155:43113",
    nativeSymbol: "AVAX",
    chain: avalancheFuji,
    rpcUrl:
      process.env.AVALANCHE_FUJI_RPC_URL ??
      "https://api.avax-test.network/ext/bc/C/rpc",
  },
];

async function readWalletBalances(client, address, usdc) {
  const [nativeBalance, usdcBalance] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({
      address: usdc.asset,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  return {
    nativeBalance,
    usdcBalance,
  };
}

for (const network of networks) {
  const client = createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  });

  const usdc = getDefaultAsset(network.network, "USDC");

  const [payerBalances, facilitatorBalances] =
    await Promise.all([
      readWalletBalances(client, payer.address, usdc),
      readWalletBalances(client, facilitator.address, usdc),
    ]);

  console.log(`\n## ${network.name}`);
  console.log(`Payer: ${payer.address}`);
  console.log(
    `Payer ${network.nativeSymbol}: ${formatEther(
      payerBalances.nativeBalance,
    )}`,
  );
  console.log(
    `Payer USDC: ${formatUnits(
      payerBalances.usdcBalance,
      usdc.decimals,
    )}`,
  );

  console.log(`Facilitator: ${facilitator.address}`);
  console.log(
    `Facilitator ${network.nativeSymbol}: ${formatEther(
      facilitatorBalances.nativeBalance,
    )}`,
  );
  console.log(
    `Facilitator USDC: ${formatUnits(
      facilitatorBalances.usdcBalance,
      usdc.decimals,
    )}`,
  );
}

console.log("\n## Readiness");
console.log("Payer needs USDC on the selected payment network.");
console.log(
  "Facilitator needs that network's native token to pay settlement gas.",
);
