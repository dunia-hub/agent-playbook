# Prompts

The Untangle Agent uses one system prompt. It lives in `src/prompt.js` as the
single source of truth, imported by both the Groq call and the tests. This file
documents the thinking behind it.

## Design goals

The whole point of this agent is **faithfulness**. A brain-dump is full of
half-decisions, maybes, and open questions. A careless summarizer flattens all
that into confident-sounding tasks with invented deadlines and owners. This
prompt is written to resist exactly that.

## The seven sections

Every response must contain these, in this exact order, as `##` headings:

1. **Decisions Already Made** — things the writer clearly settled on or committed to.
2. **Contradictions** — conflicting statements from the dump, flagged without resolution.
3. **Tasks** — concrete actions, phrased in the writer's own words, hedging kept.
4. **Grouped Ideas** — related points clustered into named themes.
5. **Priorities** — ordering derived *only* from dependencies the writer stated.
6. **Missing Info** — the unknowns and unconfirmed items the writer flagged.
7. **Next Steps** — the smallest actions that resolve Missing Info or unblock a
   stated dependency, phrased as suggestions.

## Hard rules

- Stay faithful to the writer's words; prefer their phrasing.
- Preserve uncertainty. A "maybe" stays a maybe, never becomes a decision.
- Do not invent deadlines, dates, owners, urgency, or facts.
- Priority comes only from dependencies the writer stated, never from the
  model's own judgment of importance.
- If unsure whether something belongs, put it in Missing Info rather than guess.
- Every bullet must trace back to the dump. Add nothing new.
- In the Contradictions section, list conflicts exactly as they appear. Do not
  smooth them over or pick a winner.

## Model settings

Because `openai/gpt-oss-*` are reasoning models, the call sets:

- `temperature: 0` — repeatable, discourages embellishment
- `max_completion_tokens: 4096` — enough room so reasoning doesn't starve the answer
- `reasoning_effort: 'low'` — this is a structuring task, not a hard reasoning one
- `reasoning_format: 'hidden'` — keep chain-of-thought out of the final answer

Without a high token cap, a reasoning model can spend its whole budget thinking
and return empty content. That was a real bug during development; these settings
and the retry logic fix it.

## Model fallback

The agent tries models in this order:

1. `GROQ_MODEL` from `.env` (defaults to `openai/gpt-oss-20b`)
2. `openai/gpt-oss-120b`
3. `llama-3.3-70b-versatile`
4. `llama-3.1-8b-instant`

If a model is deprecated or fails, the agent moves to the next one. If a model
returns empty content, the agent retries once with a nudge before falling back.

## JSON mode

When `--json` is passed, the agent uses Groq's structured outputs feature
(`response_format: json_schema`) to return a JSON object with the seven sections
as arrays of strings. This is useful for piping into other tools or APIs.

## Faithfulness evaluation

The `eval/faithfulness.js` script checks that the agent's output:

- Matches the expected structure (all seven sections, in order, with bullets)
- Does not invent numbers, dates, names, or venues not present in the input
- Preserves uncertainty markers from the input

Run it with:

```bash
npm run eval -- <input.txt> <output.md>
```
