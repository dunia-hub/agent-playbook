# Smart Contract Reader Agent

Dunia Hub Agent Playbook 02.

This beginner-friendly Node.js agent reads a local Solidity contract and uses
Groq to explain its behavior in plain language.

It returns exactly:

1. Contract Summary
2. Important Functions
3. Funds & State Flow
4. Privileges
5. Risk Flags

## What the agent does

- Reads a local `.sol` file
- Sends the source code to Groq
- Explains functions, state changes, fund movement, and privileges
- Points to relevant code behavior
- Preserves uncertainty
- Avoids claiming that a contract is safe
- Validates the five required response sections

This agent is an educational contract reader, not a replacement for a
professional security audit.

## Requirements

- Node.js 20 or newer
- A Groq API key

## Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```env
GROQ_API_KEY=your_real_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Never commit your `.env` file or share your API key.

## Run the agent

Analyze the personal vault example:

```bash
npm start -- contracts/SimpleVault.sol
```

Analyze the owner-controlled wallet:

```bash
npm start -- contracts/OwnerWallet.sol
```

You can also provide another local Solidity file:

```bash
npm start -- path/to/YourContract.sol
```

## Run tests

```bash
npm test
```

The tests use a mock Groq client and do not make live API calls.

## Project structure

```text
02-smart-contract-reader/
├── contracts/
│   ├── OwnerWallet.sol
│   └── SimpleVault.sol
├── src/
│   ├── groq.js
│   ├── index.js
│   ├── prompt.js
│   └── validator.js
├── test/
│   ├── groq.test.js
│   └── validator.test.js
├── .env.example
├── .gitignore
├── package.json
├── prompts.md
├── README.md
└── resources.md
```

## Example contracts

`SimpleVault.sol` tracks deposits separately and lets users withdraw their own
ETH.

`OwnerWallet.sol` pools deposited ETH and lets only the owner send funds or
transfer ownership.

## Limitations

The quality of the explanation depends on the supplied source code and model
output. Missing dependencies, inherited contracts, deployment settings, and
off-chain behavior may limit what the agent can confirm.