import { isValidSolanaAddress } from "../addresses.js";
import { evaluateNativeTransfer } from "./common.js";

export function runSolanaSpecialist(context) {
  return evaluateNativeTransfer({
    ...context,
    specialist: "Solana Specialist",
    family: "solana",
    addressIsValid: isValidSolanaAddress,
    readOnlyCalls: ["getBalance", "getFeeForMessage", "getLatestBlockhash"],
  });
}
