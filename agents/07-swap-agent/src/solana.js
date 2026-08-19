import { Connection } from "@solana/web3.js";
import { config } from "./config.js";

export const connection = new Connection(
  config.solanaRpcUrl,
  "confirmed"
);
