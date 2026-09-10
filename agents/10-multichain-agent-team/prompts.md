# Multichain Agent Team Prompt

Only the Planner uses a model. The coordinator, policy preflight, dependency graph,
specialist checks, and consensus decision are deterministic JavaScript.

## Planner output

Groq must return exactly:

1. `goal`
2. `executionMode`, fixed to `plan_only`
3. `operations`
4. `notes`

Each operation contains exactly:

- `id`
- `network`
- `action`
- `destination`
- `amount`
- `dependsOn`

## Planner boundaries

The Planner receives a reduced registry and policy containing only public routing
information. It does not receive balances or state snapshots. It may structure a
request, but it may not claim that chain state was checked.

The Planner must not:

- Invent or repair addresses, amounts, networks, assets, or dependencies
- Select a network outside the supplied registry
- Select an action outside policy
- Change `executionMode` from `plan_only`
- Request or output a private key, seed phrase, signature, or signed transaction
- Claim that any operation was executed

Every model plan then passes the same strict validation as an offline plan.

## Agent team boundaries

- The **Coordinator** dispatches validated operations and orders dependencies.
- The **Policy Agent** blocks non-testnet targets and disallowed operations.
- The **EVM Specialist** validates EVM addresses and EVM-specific read checks.
- The **Solana Specialist** decodes base58 addresses to verify 32-byte public keys.
- The **Stellar Specialist** validates StrKey version bytes and CRC16 checksums.
- The **Consensus Reviewer** requires every specialist and dependency to be ready.

The exact model prompt lives in `src/prompt.js`.

## Ideas to extend

- Add Avalanche, Arbitrum, or other EVM networks through the registry
- Add Aptos, Sui, or Cosmos specialists with native address and fee rules
- Replace local snapshots with authenticated read-only adapters
- Require two independent state sources before consensus
- Add a simulation-only specialist for each ecosystem
- Produce a human-signed approval artifact for a separate execution service
