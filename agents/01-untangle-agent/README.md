# Untangle Agent

The first project in the Dunia Hub Agent Playbook. It takes a messy, unstructured
brain-dump and reorganizes it into five clear sections without inventing anything.

## What it does

You paste chaotic notes. The agent returns:

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

   \`\`\`bash
   npm install
   \`\`\`

2. Get a free API key from https://console.groq.com/keys

3. Create your \`.env\` from the template and add your key:

   \`\`\`bash
   cp .env.example .env
   # then edit .env and paste your real key
   \`\`\`

## Usage

Run it and type your notes, ending with \`DONE\` on its own line:

\`\`\`bash
npm start
\`\`\`

Or pipe a file straight in:

\`\`\`bash
cat examples/event-planning.txt | npm start
\`\`\`

## Tests

Tests cover the pure logic (validation and input parsing) and make no live API
calls, so they run offline and free:

\`\`\`bash
npm test
\`\`\`

## Project layout

\`\`\`
01-untangle-agent/
├── examples/
│   └── event-planning.txt   # a deliberately chaotic sample dump
├── src/
│   ├── index.js             # the runnable agent (the only file that calls Groq)
│   ├── groq.js              # Groq client and the untangle() call
│   ├── prompt.js            # the Untangle system prompt + required sections
│   ├── input.js             # multi-line stdin reader, stops at DONE
│   └── validate.js          # checks the five sections are present and ordered
├── test/
│   └── untangle.test.js     # offline tests for validate + input
├── .env.example
├── prompts.md
├── resources.md
└── README.md
\`\`\`

## Config

Two variables live in \`.env\` (never commit the real key):

- \`GROQ_API_KEY\` — your Groq key
- \`GROQ_MODEL\` — defaults to \`openai/gpt-oss-20b\`; swap to \`openai/gpt-oss-120b\` for higher quality
