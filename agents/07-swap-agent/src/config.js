import "dotenv/config";

const required = [
  "GROQ_API_KEY",
  "GROQ_MODEL",
  "SOLANA_RPC_URL",
  "SOLANA_NETWORK",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL,
  solanaRpcUrl: process.env.SOLANA_RPC_URL,
  solanaNetwork: process.env.SOLANA_NETWORK,
};
