# Gas Agent

Dunia Hub Agent Playbook 05.

This read-only Node.js agent turns blockchain fee data into a decision-ready report.
It compares EVM networks, estimates the expected and conservative maximum cost of a
specific transaction, applies the user's budget and fee limits, flags stale data, and
identifies the lowest-cost network that is currently within policy.

## What the agent does

- Reads saved fee snapshots entirely offline
- Optionally reads live EVM fee data through configured RPC endpoints
- Supports EIP-1559 and legacy gas-price models
- Includes an optional L1 data-fee estimate for rollups
- Uses `BigInt` for wei calculations to avoid floating-point precision loss
- Estimates expected and conservative maximum transaction costs
- Applies a user-defined gwei ceiling and USD budget
- Flags stale fee data and unavailable USD comparisons
- Optionally asks Groq to explain the already-computed report in plain language

It never requests a private key, signs a transaction, broadcasts a transaction, or
guarantees a future fee.

## Stack

- Node.js 20 or newer with ES modules
- Built-in `fetch` for optional read-only JSON-RPC calls
- Built-in `BigInt` for fee calculations
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) for optional explanations
- [dotenv](https://www.npmjs.com/package/dotenv) for local configuration
- Node's built-in test runner (`node --test`)

No agent framework, database, paid service, wallet, or funded account is required.

## Setup

Install dependencies:

```bash
npm install
```

The offline example requires no environment file. For optional Groq explanations or
live RPC reads:

```bash
cp .env.example .env
```

Add only the values needed for the mode you plan to use. Never commit `.env` or place
private keys in it.

## Run the offline example

```bash
npm start -- \
  --networks examples/networks.snapshot.json \
  --transaction examples/transaction.json
```

The sample compares Base Sepolia, Avalanche Fuji, and Polygon Amoy for an ERC-20
transfer. Snapshot values and token prices are educational examples, not live quotes.
Freshness checks may mark them stale when run later.

## Add a Groq explanation

Add a free Groq developer key to `.env`, then run:

```bash
npm start -- \
  --networks examples/networks.snapshot.json \
  --transaction examples/transaction.json \
  --explain
```

Groq receives only the deterministic report. It does not calculate fees or choose a
network independently.

## Read live RPC fee data

Copy `.env.example` to `.env` and add RPC URLs for the networks you want to query.
Then run:

```bash
npm start -- \
  --networks examples/networks.rpc.json \
  --transaction examples/transaction.json \
  --live
```

Live mode calls only:

- `eth_chainId`
- `eth_getBlockByNumber` for the latest block
- `eth_gasPrice`
- `eth_maxPriorityFeePerGas` when supported

The configured chain ID is verified against the RPC response. The agent has no method
for signing or calling `eth_sendRawTransaction`.

## Transaction profile

`examples/transaction.json` defines the decision policy:

```json
{
  "name": "ERC-20 token transfer",
  "gasLimit": "65000",
  "baseFeeMultiplier": 2,
  "budgetUsd": 0.05,
  "maxFeeGwei": 40
}
```

- `gasLimit` is a caller-supplied estimate, stored as a string for precision.
- `baseFeeMultiplier` creates a conservative EIP-1559 ceiling and must be 1–5.
- `budgetUsd` blocks a network when its maximum estimated USD cost is too high.
- `maxFeeGwei` blocks a network when its maximum fee per gas is too high.

USD values require a manually supplied `nativeTokenPriceUsd`. They are estimates and
are never presented as live prices.

## Decision statuses

| Status | Meaning |
| --- | --- |
| `READY` | Fee data is fresh and user-defined limits are satisfied |
| `REVIEW_STALE_DATA` | Limits pass, but the snapshot is old or future-dated |
| `OVER_LIMIT` | At least one gwei or USD limit is exceeded |

`READY` is not permission to transact. It only means the supplied fee data passes the
configured checks.

## Run tests

```bash
npm test
```

The suite uses saved inputs, mocked Groq responses, and mocked JSON-RPC responses. It
makes no live calls and tests validation, precision, EIP-1559 calculations, legacy
fees, L1 data fees, budgets, freshness, cross-token comparisons, RPC chain checks,
fallback behavior, report formatting, and explanation structure.

## Project structure

```text
05-gas-agent/
├── examples/
│   ├── networks.rpc.json
│   ├── networks.snapshot.json
│   └── transaction.json
├── src/
│   ├── arguments.js
│   ├── fees.js
│   ├── files.js
│   ├── groq.js
│   ├── index.js
│   ├── prompt.js
│   ├── report.js
│   ├── rpc.js
│   ├── units.js
│   └── validate.js
├── test/
│   ├── arguments.test.js
│   ├── fees.test.js
│   ├── groq.test.js
│   ├── report.test.js
│   ├── rpc.test.js
│   ├── units.test.js
│   └── validate.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prompts.md
├── README.md
└── resources.md
```

## Safety boundaries

- RPC operations are read-only and must be enabled with `--live`.
- RPC chain IDs are checked to prevent silent endpoint mix-ups.
- Fee data is validated before calculations begin.
- User policies are applied by code, not by a model.
- Networks without token prices are not ranked across different currencies.
- The output always reminds the user to refresh fees before signing elsewhere.
- No private-key, wallet, signing, or transaction-submission code exists.

## Limitations

Gas usage depends on the exact transaction and contract state. The agent accepts a
caller-supplied gas limit and does not simulate a transaction. Rollups can have
chain-specific L1 data fees that a generic RPC reader cannot infer, so snapshots may
provide `l1DataFeeWei` manually. Public RPC endpoints can be rate-limited, and fee
conditions can change between reading the report and signing elsewhere.
