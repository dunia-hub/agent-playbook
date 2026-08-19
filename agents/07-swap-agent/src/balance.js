import {
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { connection } from "./solana.js";

export async function getSolBalance(walletAddress) {
  const publicKey = new PublicKey(walletAddress);

  const lamports = await connection.getBalance(publicKey);

  return lamports / LAMPORTS_PER_SOL;
}
