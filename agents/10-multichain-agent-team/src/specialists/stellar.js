import { isValidStellarAddress } from "../addresses.js";
import { evaluateNativeTransfer } from "./common.js";

export function runStellarSpecialist(context) {
  return evaluateNativeTransfer({
    ...context,
    specialist: "Stellar Specialist",
    family: "stellar",
    addressIsValid: isValidStellarAddress,
    readOnlyCalls: ["GET /accounts/{address}", "GET /fee_stats", "GET /ledgers?order=desc&limit=1"],
  });
}
