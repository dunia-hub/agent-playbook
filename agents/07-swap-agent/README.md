# Swap Agent

The Swap Agent is Workshop 07 in the Dunia Hub Agent Playbook series.

It turns a natural language request such as:

`Swap 0.001 SOL for USDC`

into a structured, safety checked, human approved blockchain transaction on Solana Devnet.

## What It Does

The agent:

1. Understands a natural language swap request
2. Extracts the input asset, output asset, amount, wallet, and slippage
3. Validates the requested assets and amount
4. Checks the public wallet's SOL balance
5. Requests a live swap quote and route from Raydium Devnet
6. Displays expected output, slippage, route information, and price impact
7. Blocks quotes that fail the configured safety checks
8. Prepares the Raydium swap transaction
9. Estimates the Solana network fee
10. Presents the transaction for explicit user approval
11. Exports the approved unsigned transaction to the browser signer
12. Connects to Phantom without exposing the private key
13. Simulates the transaction on Solana Devnet
14. Requests the user's signature through Phantom
15. Submits the signed transaction to Solana Devnet
16. Waits for transaction confirmation
17. Displays the confirmed transaction signature

## Agent Flow

User swap request

→ Groq parses the intent

→ Request validation

→ Solana Devnet balance check

→ Raydium Devnet quote

→ Quote safety check

→ Transaction preparation

→ Network fee estimation

→ User reviews transaction

→ Explicit YES approval

→ Unsigned transaction handed to Phantom

→ Phantom requests user signature

→ Signed transaction submitted to Solana Devnet

→ Transaction confirmation

→ Transaction signature returned

## Human Approval Boundary

The current implementation does not give the AI model control of a wallet private key.

The agent prepares and evaluates the transaction, but the irreversible signing action remains with the user.

The flow is:

Agent decides and prepares

→ User explicitly approves

→ Phantom signs

→ Transaction is submitted

This keeps the wallet's private signing material outside the agent.

Future versions can explore policy controlled or delegated autonomous signing with strict spending and safety limits.

## Safety

This implementation is testnet only.

It does not:

- store the Phantom private key
- expose a seed phrase
- send private signing material to Groq
- automatically sign transactions without user approval
- support autonomous mainnet execution

The wallet address used by the agent is public information.

Before transaction preparation, the agent checks:

- supported assets
- requested amount
- wallet format
- available SOL balance
- slippage
- price impact

The current implementation blocks a quote when price impact exceeds the configured 5% safety threshold.

The 5% threshold is a project configuration for this educational implementation. It is not a universal trading rule.

## Supported Assets

The current version supports:

- SOL
- USDC

Verified token mint addresses are defined in:

`src/tokens.js`

## Networks and Services

The project currently uses:

- Solana Devnet
- Raydium Devnet
- Groq for natural language parsing
- Phantom for user controlled transaction signing

Groq is used only to interpret the user's natural language request.

Blockchain balances, token addresses, quotes, fees, transaction data, and confirmation results come from deterministic blockchain or exchange tooling rather than being invented by the model.

## Requirements

- Node.js 24 recommended
- npm
- Internet connection
- Groq API key
- Phantom browser extension
- Phantom Testnet Mode enabled
- Solana Devnet wallet
- Devnet SOL

## Setup

Install dependencies:

`npm install`

Create a local `.env` using `.env.example` as the template.

Never commit your real Groq API key.

The generated transaction handoff file is also ignored by Git.

## Run the Agent

Start the terminal agent:

`npm start`

Example request:

`Swap 0.001 SOL for USDC`

The agent will ask for missing information such as:

- wallet address
- slippage tolerance

After validation and quote checks, the agent displays the transaction details and asks:

`Type YES to approve this swap, or anything else to cancel:`

If approved, the unsigned transaction is exported for Phantom signing.

## Run the Phantom Signer

In a second terminal:

`npm run signer`

Open the localhost URL displayed by Vite in a browser where Phantom is installed.

The signing page displays:

- network
- wallet
- input amount
- expected output
- slippage
- price impact
- estimated network fee
- prepared transaction count

Connect Phantom and verify that the connected wallet matches the wallet used to prepare the swap.

Then select:

`Sign & Submit Swap`

The transaction is simulated on Solana Devnet before Phantom asks the user to sign.

After signing, the transaction is submitted to Solana Devnet and the page waits for confirmation.

A successful execution displays the confirmed transaction signature.

## Confirmed Devnet Test

The end to end workflow has been successfully tested with:

`0.001 SOL → USDC`

The tested flow successfully:

- parsed the natural language instruction
- validated the request
- checked the wallet balance
- obtained a Raydium Devnet quote
- passed the configured price impact check
- estimated the network fee
- prepared the transaction
- received explicit user approval
- connected Phantom
- requested the user's signature
- submitted the transaction
- confirmed the transaction on Solana Devnet

Raydium Devnet liquidity changes over time, so the exact quote and price impact may differ between runs.

## Tests

Run:

`npm test`

The current offline tests cover:

- valid swap requests
- invalid amounts
- identical input and output assets
- invalid Solana wallet addresses
- invalid slippage
- insufficient SOL balance
- unsafe price impact
- supported token lookup

The automated tests do not make live Groq, Solana RPC, or Raydium calls.

Additional execution and autonomous agent test coverage is tracked in the open contributor issues.

## Devnet Note

Raydium Devnet liquidity can be limited and volatile.

A route existing does not mean it is a good route.

During testing, several SOL to USDC quotes produced high price impact and were correctly blocked.

For example, larger test swaps were rejected while a smaller available quote passed the configured safety threshold.

This is intentional behavior.

A useful Swap Agent must be capable of deciding not to proceed when the available execution path is unsafe.

## Project Structure

`src/config.js`  
Loads environment configuration.

`src/groq.js`  
Creates the Groq client.

`src/prompt.js`  
Defines the Swap Agent natural language parsing instructions.

`src/parseSwap.js`  
Turns natural language into structured swap data.

`src/validateSwap.js`  
Validates the swap request.

`src/solana.js`  
Connects to Solana Devnet.

`src/balance.js`  
Reads the wallet SOL balance.

`src/tokens.js`  
Contains supported and verified token information.

`src/raydium.js`  
Requests a Raydium Devnet swap quote.

`src/checkBalance.js`  
Blocks swaps the wallet cannot afford.

`src/checkQuote.js`  
Blocks quotes that exceed the configured price impact threshold.

`src/prepareSwap.js`  
Builds the Raydium swap transaction and estimates the Solana network fee.

`src/exportSwap.js`  
Exports an approved unsigned transaction for the browser signing boundary.

`src/index.js`  
Runs the terminal agent flow and explicit approval step.

`signer/index.html`  
Provides the human transaction review and Phantom signing interface.

`signer/main.js`  
Connects Phantom, simulates the transaction, requests the user's signature, submits the transaction, and waits for confirmation.

`signer/style.css`  
Provides the Dunia Hub styled transaction review interface.

`scripts/findSafeQuote.js`  
Helps find a Raydium Devnet quote that falls within the configured price impact threshold.

`tests/swap.test.js`  
Contains offline validation and safety tests.

## Open Contributor Work

The next stage is moving from human approved execution toward bounded agent autonomy.

Open work includes:

- policy controlled autonomous signing on Solana Devnet
- autonomous swap policy and spending limits
- autonomous trigger and decision loops
- comparison of multiple swap routes
- quote freshness and pre execution revalidation
- post swap balance verification and execution reporting
- emergency pause and signer revocation controls
- expanded autonomous execution and safety tests

The goal is not unrestricted wallet access.

The goal is an agent that can act independently only within explicit, revocable permissions and safety limits.

## Important

This agent is an educational testnet project.

It is not financial advice and should not be used as a production trading system without significantly stronger security, validation, testing, monitoring, wallet controls, and independent review.
