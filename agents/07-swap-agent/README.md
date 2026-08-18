# Swap Agent

The Swap Agent is Workshop 07 in the Dunia Hub Agent Playbook series.

It turns a natural language request such as:

`Swap 0.1 SOL for USDC`

into a structured and safety checked swap workflow on Solana Devnet.

## What It Does

The agent:

1. Understands a natural language swap request
2. Extracts the input asset, output asset, amount, wallet, and slippage
3. Validates the request
4. Checks the public wallet's SOL balance
5. Requests a real quote from Raydium Devnet
6. Displays the expected output and price impact
7. Blocks swaps that fail the workshop safety checks

## Agent Flow

User swap request

→ Groq parses the intent

→ Request validation

→ Solana Devnet balance check

→ Raydium Devnet quote

→ Quote safety check

→ Stop or continue to user approval

## Safety

This workshop implementation is testnet only.

It does not:

- store a private key
- sign transactions
- submit transactions
- automatically approve swaps

The wallet address used by the agent is public information only.

A swap is also blocked when the quoted price impact is above the workshop safety threshold.

## Supported Assets

The current workshop version supports:

- SOL
- USDC

Token mint addresses are defined in `src/tokens.js`.

## Requirements

- Node.js 24 recommended
- npm
- Internet connection
- Groq API key
- Solana Devnet wallet
- Devnet SOL

## Setup

Install dependencies:

`npm install`

Create a local `.env` using `.env.example` as the template.

Never commit your real Groq API key.

## Run

Start the agent:

`npm start`

Example request:

`Swap 0.1 SOL for USDC`

The agent will ask for any missing information such as the wallet address or slippage tolerance.

## Tests

Run:

`npm test`

The tests cover:

- valid swap requests
- invalid amounts
- identical input and output assets
- invalid Solana wallet addresses
- invalid slippage
- insufficient SOL balance
- unsafe price impact
- supported token lookup

The automated tests do not call Groq, Solana RPC, or Raydium.

## Devnet Note

Raydium Devnet liquidity can be limited.

A route existing does not mean it is a good route.

During testing, some SOL to USDC quotes produced high price impact and were correctly blocked by the agent.

This is useful behavior: a Swap Agent should be able to decide not to proceed when a quote is unsafe.

## Project Structure

`src/config.js`  
Loads environment configuration.

`src/groq.js`  
Creates the Groq client.

`src/prompt.js`  
Defines the Swap Agent instruction.

`src/parseSwap.js`  
Turns natural language into structured swap data.

`src/validateSwap.js`  
Validates the swap request.

`src/solana.js`  
Connects to Solana Devnet.

`src/balance.js`  
Reads the wallet SOL balance.

`src/tokens.js`  
Contains supported token information.

`src/raydium.js`  
Requests a Raydium Devnet quote.

`src/checkBalance.js`  
Blocks swaps the wallet cannot afford.

`src/checkQuote.js`  
Blocks quotes with unsafe price impact.

`src/index.js`  
Runs the terminal flow.

`tests/swap.test.js`  
Contains offline safety tests.

## Next Steps

Possible contributor improvements include:

- support SPL token balance checks
- support additional verified Devnet tokens
- inspect multiple available routes
- improve quote freshness checks
- estimate transaction fees
- prepare an unsigned Raydium transaction
- add an explicit user approval step
- support wallet based signing without exposing private keys
- improve retry and API error handling
- add more offline tests

## Important

This agent is an educational testnet project.

It is not financial advice and should not be used as a production trading system without significantly stronger security, validation, testing, and review.
