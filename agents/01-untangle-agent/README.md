# Untangle Agent

The first project in the Dunia Hub Agent Playbook. It takes a messy, unstructured
brain-dump and reorganizes it into seven clear sections without inventing anything.

## What it does

You paste chaotic notes. The agent returns:

- **Decisions Already Made** — things the writer clearly settled on
- **Contradictions** — conflicting statements flagged without resolution
- **Tasks** — concrete actions pulled straight from your words
- **Grouped Ideas** — related points clustered into themes
- **Priorities** — ordering based only on dependencies you actually stated
- **Missing Info** — the open questions and unknowns you flagged
- **Next Steps** — small actions to resolve the unknowns

It stays faithful to what you wrote. It preserves uncertainty and never invents
deadlines, owners, urgency, or facts.

## Stack

- Node.js with ES modules
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) for fast LLM inference
- [dotenv](https://www.npmjs.com/package/dotenv) for config
- Node's built-in test runner (`node --test`), no test framework

No agent framework, database, frontend, or Docker.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a free API key from https://console.groq.com/keys

3. Create your `.env` from the template and add your key:

   ```bash
   cp .env.example .env
   # then edit .env and paste your real key
   ```

## Usage

Run it and type your notes, ending with `DONE` on its own line:

```bash
npm start
```

Or pipe a file straight in:

```bash
cat examples/event-planning.txt | npm start
```

### Flags

- `--json` — output structured JSON instead of Markdown (uses Groq structured outputs)
- `--out <path>` — save the output to a file

```bash
cat examples/event-planning.txt | npm start -- --out result.md
cat examples/event-planning.txt | npm start -- --json --out result.json
```

## Tests

Tests cover the pure logic (validation and input parsing) and make no live API
calls, so they run offline and free:

```bash
npm test
```

## Faithfulness Evaluation

Run the faithfulness eval script to check that the agent's output stays true to
the input without inventing facts:

```bash
npm run eval -- examples/event-planning.txt output.md
```

## Project layout

```
01-untangle-agent/
├── examples/
│   ├── event-planning.txt   # a deliberately chaotic sample dump
│   ├── product-launch.txt   # another chaotic brain-dump with contradictions
│   └── team-retreat.txt     # planning chaos with conflicting preferences
├── src/
│   ├── index.js             # the runnable agent (the only file that calls Groq)
│   ├── groq.js              # Groq client, fallback chain, and the untangle() call
│   ├── prompt.js            # the Untangle system prompt + required sections
│   ├── input.js             # multi-line stdin reader, stops at DONE
│   └── validate.js          # checks the seven sections are present, ordered, and non-empty
├── test/
│   └── untangle.test.js     # offline tests for validate + input
├── eval/
│   └── faithfulness.js      # faithfulness evaluation script
├── .env.example
├── prompts.md
├── resources.md
└── README.md
```

## Config

Two variables live in `.env` (never commit the real key):

- `GROQ_API_KEY` — your Groq key
- `GROQ_MODEL` — defaults to `openai/gpt-oss-20b`; swap to `openai/gpt-oss-120b` for higher quality

## Model Fallback

If the configured model fails or is deprecated, the agent automatically tries a
fallback chain:

1. `openai/gpt-oss-20b`
2. `openai/gpt-oss-120b`
3. `llama-3.3-70b-versatile`
4. `llama-3.1-8b-instant`

If a model returns empty content (a known issue with reasoning models), the
agent retries once with a nudge before moving to the next fallback.
