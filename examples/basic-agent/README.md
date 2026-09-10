# Basic Agent Example

This is the smallest runnable agent in Agent Playbook. It receives one piece of
text, classifies the intent and priority, then returns a predictable action
summary.

It is deliberately deterministic: no model, API key, account, or network call
is required. That makes the control flow easy to read before adding an LLM.

## Flow

1. Receive and validate an input
2. Apply the agent's decision rules
3. Return a structured result

## Requirements

- Node.js 20 or newer

## Run it

```bash
npm install
npm start -- --input "Please review the workshop outline today"
```

Read input from a file:

```bash
npm start -- --file examples/request.txt
```

Return machine-readable JSON:

```bash
npm start -- --file examples/request.txt --json
```

## Test it

```bash
npm test
```

## What to notice

- `src/arguments.js` owns command-line parsing.
- `src/agent.js` contains the agent's instructions and decision logic.
- `src/format.js` keeps presentation separate from decisions.
- Tests call the logic directly and do not depend on a live service.

This example is a teaching baseline, not a general natural-language classifier.
