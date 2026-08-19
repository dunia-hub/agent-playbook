import "dotenv/config";
import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { getDefaultAsset } from "../src/assets.js";

if (!process.env.EVM_PRIVATE_KEY) {
  throw new Error("EVM_PRIVATE_KEY is missing.");
}

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY);
const usdc = getDefaultAsset("eip155:84532", "USDC");

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const [ethBalance, usdcBalance] = await Promise.all([
  client.getBalance({ address: account.address }),
  client.readContract({
    address: usdc.asset,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  }),
]);

console.log(`Wallet: ${account.address}`);
console.log(`Base Sepolia ETH: ${formatEther(ethBalance)}`);
console.log(
  `Base Sepolia USDC: ${formatUnits(usdcBalance, usdc.decimals)}`,
);
