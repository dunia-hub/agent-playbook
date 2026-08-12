# Prompts

The Untangle Agent uses one system prompt. It lives in \`src/prompt.js\` as the
single source of truth, imported by both the Groq call and the tests. This file
documents the thinking behind it.

## Design goals

The whole point of this agent is **faithfulness**. A brain-dump is full of
half-decisions, maybes, and open questions. A careless summarizer flattens all
that into confident-sounding tasks with invented deadlines and owners. This
prompt is written to resist exactly that.

## The five sections

Every response must contain these, in this exact order, as \`##\` headings:

1. **Tasks** — concrete actions, phrased in the writer's own words, hedging kept.
2. **Grouped Ideas** — related points clustered into named themes.
3. **Priorities** — ordering derived *only* from dependencies the writer stated.
4. **Missing Info** — the unknowns and unconfirmed items the writer flagged.
5. **Next Steps** — the smallest actions that resolve Missing Info or unblock a
   stated dependency, phrased as suggestions.

## Hard rules

- Stay faithful to the writer's words; prefer their phrasing.
- Preserve uncertainty. A "maybe" stays a maybe, never becomes a decision.
- Do not invent deadlines, dates, owners, urgency, or facts.
- Priority comes only from dependencies the writer stated, never from the
  model's own judgment of importance.
- If unsure whether something belongs, put it in Missing Info rather than guess.
- Every bullet must trace back to the dump. Add nothing new.

## Model settings

Because \`openai/gpt-oss-*\` are reasoning models, the call sets:

- \`temperature: 0\` — repeatable, discourages embellishment
- \`max_completion_tokens: 4096\` — enough room so reasoning doesn't starve the answer
- \`reasoning_effort: 'low'\` — this is a structuring task, not a hard reasoning one
- \`reasoning_format: 'hidden'\` — keep chain-of-thought out of the final answer

Without a high token cap, a reasoning model can spend its whole budget thinking
and return empty content. That was a real bug during development; these settings
fix it.

## Ideas to extend

- Add a "Decisions Already Made" section for things the writer clearly settled.
- Detect and flag contradictions in the dump.
- Support a \`--json\` mode using Groq structured outputs for machine-readable output.
