# New Agent Template

Use this folder as the starting point for an Agent Playbook contribution. It is
a complete Node.js agent with offline and optional Groq modes, strict output
validation, Markdown and JSON output, examples, documentation, and tests.

The included Starter Agent turns a request into four sections: a summary,
actions, assumptions, and safety notes. Replace that teaching behavior with the
purpose of your own agent.

## Status

Template — copy and customize before submitting.

## How it works

1. The CLI accepts inline text or a text file.
2. Offline mode reads a saved response fixture for free, repeatable testing.
3. Online mode sends the input and bounded system prompt to Groq.
4. The response parser accepts plain JSON or one JSON code fence.
5. Strict validation rejects missing, extra, empty, or oversized fields.
6. The formatter returns readable Markdown or machine-readable JSON.

No tool or external action is enabled by default.

## Requirements

- Node.js 20 or newer
- npm
- Optional: a Groq developer account and `GROQ_API_KEY`

Offline mode needs no API key, account, model download, wallet, blockchain, or
external service. Groq usage may be subject to its current free-tier limits and
pricing; check the provider documentation before running online mode.

## Run locally

Install dependencies:

```bash
npm install
```

Run the reproducible offline example:

```bash
npm start -- \
  --file examples/request.txt \
  --response examples/response.json
```

Return JSON:

```bash
npm start -- \
  --file examples/request.txt \
  --response examples/response.json \
  --json
```

Optional Groq mode:

```bash
cp .env.example .env
```

Add your Groq key to `.env`, then run:

```bash
npm start -- --input "YOUR REQUEST"
```

Never commit `.env` or an API key.

## Customize the template

Before opening a pull request:

1. Rename the copied folder and update `name` and `description` in `package.json`.
2. Replace the Starter Agent description and examples in this README.
3. Update the response schema in `src/validate.js`.
4. Update the system instructions in `src/prompt.js` and `prompts.md`.
5. Replace the example request and response with realistic fixtures.
6. Add tools only when they are necessary, scoped, and documented.
7. Add tests for normal, invalid, and safety-sensitive cases.
8. Document every external service, permission, side effect, and possible cost.
9. Remove every `CUSTOMIZE` marker after completing the implementation.

Find remaining markers with:

```bash
npm run check:template
```

This command intentionally fails until all customization markers are removed.

## Safety and permissions

- Offline mode reads only the input and response files you select.
- Online mode sends the supplied input to Groq; do not use secrets, private
  keys, seed phrases, personal data, or confidential material.
- The starter has no wallet, signing, transaction, messaging, filesystem-write,
  or deployment capability.
- If your agent adds an external action, preview it first and require explicit
  user approval immediately before execution.
- Validate model and tool output before using it.

## Limitations

- The default response fixture is illustrative, not generated from the request.
- The starter schema is intentionally small and will not suit every agent.
- Model output can be incomplete or wrong even after structural validation.
- No production authentication, persistence, monitoring, or rate limiting is
  included.

## Tests

```bash
npm test
```

The tests use a fake Groq client and never make live API requests.

## Project structure

```text
new-agent/
├── examples/
│   ├── request.txt
│   └── response.json
├── src/
│   ├── arguments.js
│   ├── files.js
│   ├── format.js
│   ├── groq.js
│   ├── index.js
│   ├── prompt.js
│   └── validate.js
├── test/
├── .env.example
├── .gitignore
├── package.json
├── prompts.md
├── resources.md
└── README.md
```

## Contributing

Copy this folder into `community-agents/`, finish the customization checklist,
and follow the repository contribution guidelines. Improvements to the template,
tests, safety guidance, and documentation are welcome.
