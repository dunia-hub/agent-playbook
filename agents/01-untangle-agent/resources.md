# Resources

Links and references for the Untangle Agent and the wider Agent Playbook.

## Groq

- Groq Console (get your API key): https://console.groq.com/keys
- Supported models: https://console.groq.com/docs/models
- Reasoning models and \`reasoning_effort\` / \`reasoning_format\`: https://console.groq.com/docs/reasoning
- Model deprecations (check before pinning a model): https://console.groq.com/docs/deprecations
- groq-sdk on npm: https://www.npmjs.com/package/groq-sdk

> Note: Groq deprecated \`llama-3.3-70b-versatile\` and \`llama-3.1-8b-instant\`
> on June 17, 2026. This project uses \`openai/gpt-oss-20b\` by default.

## Node.js

- ES modules: https://nodejs.org/api/esm.html
- Built-in test runner: https://nodejs.org/api/test.html
- readline: https://nodejs.org/api/readline.html
- dotenv on npm: https://www.npmjs.com/package/dotenv

## Concepts

- Faithful summarization: the agent's core discipline is reorganizing without
  adding. Keep this in mind when extending the prompt.
- Reasoning models: they "think" in tokens before answering. Give them enough
  budget or they return empty content.

## Dunia Hub

- Community: https://duniahub.xyz
- The Agent Playbook is a workshop series for beginner-to-advanced agent builders.
  This Untangle Agent is Session 01.
