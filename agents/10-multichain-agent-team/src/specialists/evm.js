import { isValidEvmAddress } from "../addresses.js";
import { evaluateNativeTransfer } from "./common.js";

export function runEvmSpecialist(context) {
  return evaluateNativeTransfer({
    ...context,
    specialist: "EVM Specialist",
    family: "evm",
    addressIsValid: isValidEvmAddress,
    readOnlyCalls: ["eth_getBalance", "eth_estimateGas", "eth_getBlockByNumber"],
  });
}
