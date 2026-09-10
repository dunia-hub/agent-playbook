# Community Agent Example

This example shows builders how to organize an agent they want to contribute to
Agent Playbook. The runnable agent reviews a small contribution manifest and
reports whether the proposed community agent is ready for human review.

It does not approve or submit a contribution. It turns repository expectations
into visible, testable checks.

## What a community agent should include

- A clear name and purpose
- Simple run and test commands
- At least one documented safety rule
- An honest list of external services, or an empty list
- A lowercase, hyphenated folder slug

## Requirements

- Node.js 20 or newer

## Run it

```bash
npm install
npm start -- --submission examples/submission.json
```

Return JSON:

```bash
npm start -- --submission examples/submission.json --json
```

## Test it

```bash
npm test
```

## What to notice

- Validation checks the manifest shape before review begins.
- Each readiness check returns evidence, not only a score.
- A failed check produces a concrete recommendation.
- `READY_FOR_HUMAN_REVIEW` is not an automated approval.

Use [`../../templates/new-agent`](../../templates/new-agent) when creating a
real contribution, and follow the repository contribution guidelines.
