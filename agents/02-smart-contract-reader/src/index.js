import "dotenv/config";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { CONTRACT_READER_PROMPT } from "./prompt.js";
import { readContractWithGroq } from "./groq.js";
import { validateResponse } from "./validator.js";

async function loadContract(filePath) {
  if (!filePath) {
    throw new Error(
      "Missing contract file. Example: npm start -- contracts/SimpleVault.sol"
    );
  }

  if (extname(filePath).toLowerCase() !== ".sol") {
    throw new Error("The input file must use the .sol extension.");
  }

  const absolutePath = resolve(filePath);
  const sourceCode = await readFile(absolutePath, "utf8");

  if (!sourceCode.trim()) {
    throw new Error("The contract file is empty.");
  }

  return sourceCode;
}

async function main() {
  try {
    const filePath = process.argv[2];
    const sourceCode = await loadContract(filePath);

    const response = await readContractWithGroq({
      sourceCode,
      systemPrompt: CONTRACT_READER_PROMPT,
    });

    validateResponse(response);
    console.log(response);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();