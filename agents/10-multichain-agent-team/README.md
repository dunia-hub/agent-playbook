# Multichain Agent Team

Dunia Hub Agent Playbook 10.

This final project demonstrates a real multi-agent pattern across blockchain
ecosystems. A Coordinator dispatches a plan to EVM, Solana, and Stellar specialists.
Each specialist independently evaluates its operation, the Policy Agent enforces
global limits, and a Consensus Reviewer blocks the team unless every required check
and dependency passes.

The result is a transparent, plan-only handoff. No agent can sign, bridge, or submit a
transaction.

## The agent team

| Agent | Responsibility |
| --- | --- |
| Planner | Converts a natural-language goal into a constrained plan, or accepts an offline plan |
| Coordinator | Routes operations to the correct specialist and orders dependencies |
| Policy Agent | Enforces testnet-only mode, action allowlists, operation limits, and amount ceilings |
| EVM Specialist | Validates EVM addresses, balances, fees, reserves, and EVM read checks |
| Solana Specialist | Validates 32-byte base58 addresses, balances, fees, reserves, and Solana read checks |
| Stellar Specialist | Validates StrKey version and checksum, balances, fees, reserves, and Horizon reads |
| Consensus Reviewer | Requires all specialists and dependencies to return ready |

## What it checks

- The plan is explicitly `plan_only`
- Every network is registered and allowed by policy
- Every target is a testnet when testnet-only policy is active
- Every action is allowlisted
- Operation IDs and dependencies are valid and acyclic
- EVM, Solana, and Stellar destinations pass family-specific validation
- Decimal amounts fit each asset’s native precision
- Amounts remain within per-network ceilings
- Snapshot balances cover amount, estimated fee, and minimum reserve
- State snapshots are fresh and not dated suspiciously in the future
- Blocked dependencies propagate to downstream operations

## Stack

- Node.js 20 or newer with ES modules
- Built-in `BigInt` for exact multichain amount calculations
- Native base58 decoding for Solana address validation
- Native base32, version-byte, and CRC16 validation for Stellar StrKey addresses
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) for optional goal planning
- [dotenv](https://www.npmjs.com/package/dotenv) for local configuration
- Node's built-in test runner (`node --test`)

No agent framework, wallet, blockchain SDK, funded account, paid model, database, or
RPC endpoint is required.

## Setup

Install dependencies:

```bash
npm install
```

The offline team requires no `.env`. To turn a new natural-language request into a
plan with Groq:

```bash
cp .env.example .env
```

Add a free Groq developer key. Never add private keys, seed phrases, wallet files, or
production credentials.

## Run the complete team offline

```bash
npm start -- \
  --plan examples/plan.json \
  --registry examples/registry.json \
  --state examples/state.json \
  --policy examples/policy.json
```

The example prepares a testnet welcome-reward plan across Base Sepolia, Solana
Devnet, and Stellar Testnet. It demonstrates cross-ecosystem routing and ordered
dependencies without making a network call.

The report shows:

- Coordinator routing and dependency order
- Each specialist’s checks and read-only calls represented by the snapshot
- Per-network amount, fee, reserve, and remaining balance
- Specialist status and blockers
- Team consensus
- An explicit no-execution safety boundary

Saved snapshots are educational fixtures. Their freshness policy may block the team
when run later; update the example timestamps or supply new read-only state data.

## Plan a new goal with Groq

The example goal includes exact networks, amounts, destinations, and ordering:

```bash
npm start -- \
  --request examples/goal.txt \
  --registry examples/registry.json \
  --state examples/state.json \
  --policy examples/policy.json
```

Groq acts only as the Planner. It receives the public registry, policy limits, and
goal—not balances or state. Its JSON must pass strict validation before any
specialist runs.

## Export a plan-only handoff

```bash
npm start -- \
  --plan examples/plan.json \
  --registry examples/registry.json \
  --state examples/state.json \
  --policy examples/policy.json \
  --export output/team-handoff.json
```

The ignored handoff file records specialist findings and consensus. It always contains
`executionAuthorized: false`, an empty `signatures` array, and an empty `transactions`
array.

## Add another network

EVM-compatible testnets can reuse the EVM specialist by adding a registry entry,
state snapshot, and policy ceiling. A new ecosystem should add a specialist with its
own address, amount, reserve, and fee rules rather than pretending every chain works
like Ethereum.

## Run tests

```bash
npm test
```

The offline suite covers CLI parsing, exact unit conversion, EVM validation, Solana
base58 decoding, Stellar StrKey checksums, registry and policy validation, plan schema,
dependency cycles, specialist limits, balances, reserves, freshness, future dates,
cross-agent blocker propagation, testnet preflight, consensus, report safety language,
and mocked Groq planning. No live model or blockchain call is made.

## Project structure

```text
10-multichain-agent-team/
├── examples/
│   ├── goal.txt
│   ├── plan.json
│   ├── policy.json
│   ├── registry.json
│   └── state.json
├── src/
│   ├── specialists/
│   │   ├── common.js
│   │   ├── evm.js
│   │   ├── solana.js
│   │   └── stellar.js
│   ├── addresses.js
│   ├── arguments.js
│   ├── coordinator.js
│   ├── files.js
│   ├── graph.js
│   ├── groq.js
│   ├── index.js
│   ├── planner.js
│   ├── policy.js
│   ├── prompt.js
│   ├── report.js
│   ├── units.js
│   └── validate.js
├── test/
│   ├── addresses.test.js
│   ├── arguments.test.js
│   ├── coordinator.test.js
│   ├── graph.test.js
│   ├── groq.test.js
│   ├── planner.test.js
│   ├── report.test.js
│   ├── specialists.test.js
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

- The only accepted execution mode is `plan_only`.
- The default policy allows only testnets and `prepare_native_transfer`.
- No specialist contains networking, wallet, bridge, signing, or send code.
- The model cannot override the registry, policy, validators, or consensus.
- Invalid addresses, insufficient balances, excess amounts, and stale state block the
  relevant operation.
- A blocked prerequisite blocks every dependent operation.
- Exported handoffs cannot authorize execution and contain no transactions.

## Limitations

This workshop version evaluates supplied snapshots rather than querying live chains.
An estimated fee is not a guarantee, and balances can change. It plans native-asset
transfers only; tokens, trustlines, associated token accounts, contract calls, bridges,
and chain-specific transaction construction need separate specialist logic. A
production system would also need independent state sources, simulation, durable
audit records, human approval, secure signers, monitoring, and a separately designed
execution service.
