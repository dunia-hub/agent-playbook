# Tool Using Agent Example

This example demonstrates how an agent chooses and calls a tool instead of
inventing an answer. It answers workshop questions using a small local catalog.

The tool boundary is visible in the output, so builders can see the decision,
tool call, validated result, and final answer. It makes no network calls and
requires no API key.

## Flow

1. Receive a request
2. Decide which tool is needed
3. Call the selected tool
4. Validate the tool result
5. Explain the grounded result

## Requirements

- Node.js 20 or newer

## Run it

```bash
npm install
npm start -- \
  --request "When is the Smart Contract Reader workshop?" \
  --catalog examples/workshops.json
```

List the catalog:

```bash
npm start -- \
  --request "List all workshops" \
  --catalog examples/workshops.json
```

Add `--json` to inspect the complete agent trace.

## Test it

```bash
npm test
```

## What to notice

- The agent can select only registered tools.
- Tools return data; they do not compose the final answer.
- The agent reports when the catalog does not support a request.
- Tool results are validated before they are used.

The catalog is a fixture for learning, not a live event schedule.
