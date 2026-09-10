# Prompt Guide

The active system prompt lives in `src/prompt.js`. Keep this file synchronized
with the implemented behavior.

## CUSTOMIZE: Agent role

Replace the Starter Agent role with one narrow purpose. State what evidence the
agent may use, what decisions it may make, and what it must never claim to do.

## Default response schema

```json
{
  "summary": "string",
  "actions": ["string"],
  "assumptions": ["string"],
  "safetyNotes": ["string"]
}
```

## Prompt rules

1. Require JSON only when the application parses JSON.
2. List exact required keys and keep the validator in sync.
3. Bound input, output arrays, and field lengths.
4. Require assumptions to be explicit.
5. Prevent claims that an unimplemented action occurred.
6. Never request passwords, API keys, seed phrases, or private keys.
7. Treat model output as untrusted until it passes validation.
8. Test malformed, incomplete, fenced, and empty responses.

Add domain-specific grounding, refusal, permission, and escalation rules before
using this template for a real workflow.
