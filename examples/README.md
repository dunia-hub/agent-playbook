# Agent Examples

This directory contains small, runnable examples that explain common agent
patterns before builders work on the full workshop projects.

| Example | Pattern | External service |
| --- | --- | --- |
| [Basic Agent](./basic-agent) | Input, decision rules, structured response | None |
| [Tool Using Agent](./tool-using-agent) | Tool selection, tool call, grounded answer | None |
| [Community Agent](./community-agent) | Validation, readiness checks, human handoff | None |

Every example:

- Runs locally with Node.js 20 or newer
- Uses ES modules and the built-in Node.js test runner
- Works without an API key or paid AI service
- Keeps decisions separate from formatting
- Includes a README, example input, and tests

## Quick start

Each folder is an independent project. Choose one and run its documented
command. For example:

```bash
cd examples/basic-agent
npm install
npm test
npm start -- --file examples/request.txt
```

These examples favor clarity over production complexity. The projects in
[`../agents`](../agents) demonstrate fuller workflows, model integration,
policy controls, and more extensive testing.
