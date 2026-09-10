# Gas Agent Prompt

The Gas Agent separates fee calculation from language generation. Deterministic code
reads and validates fee data, performs integer-based calculations, applies user limits,
and ranks comparable networks. Groq is an optional explanation layer.

## Required explanation sections

When `--explain` is used, Groq must return exactly:

1. `Fee Summary`
2. `Cost Drivers`
3. `Budget Check`
4. `Risk Flags`
5. `Next Action`

## Grounding rules

The model must:

- Preserve computed fees, costs, statuses, limits, and network names
- Distinguish expected cost from conservative maximum cost
- Explain the difference between gas limit and fee per gas
- Identify manually supplied USD prices as estimates
- Treat stale data as stale
- Refuse to recommend a network marked `OVER_LIMIT`

The model must not:

- Recalculate the deterministic report
- Invent live market or network conditions
- Claim future fees are guaranteed
- Claim that a transaction was signed or sent
- Provide private-key, signing, or submission instructions

The exact runtime prompt and section validator live in `src/prompt.js`.

## Why explanation is optional

The estimator is useful without any model call. This keeps the workshop free, makes
the calculations auditable, and lets tests cover the decision logic without network
access. Groq adds a plain-language explanation only when the user explicitly requests
it with `--explain`.

## Ideas to extend

- Add chain-specific L1 data-fee or blob-fee readers
- Estimate gas with `eth_estimateGas` for unsigned transaction objects
- Store historical snapshots and explain fee trends
- Add local-model explanation through Ollama
- Recheck the chosen network immediately before a separate signing workflow
