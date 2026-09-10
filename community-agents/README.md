# Community Agents

This directory is for agents contributed by the Agent Playbook community.

Builders are encouraged to experiment, improve existing ideas, and contribute
agents that solve practical or creative problems. Community agents are reviewed
individually and are not automatically endorsed by Dunia Hub.

Start with [`../templates/new-agent`](../templates/new-agent), then use the
validator in this folder before opening a pull request.

## Add your agent

1. Open an Agent Proposal issue before beginning a large contribution.
2. Copy the reusable template into this directory.
3. Rename the folder using a clear lowercase, hyphenated name.
4. Replace every `CUSTOMIZE` marker and implement the agent.
5. Run the agent, its tests, and the community validation command.
6. Complete [`SUBMISSION_CHECKLIST.md`](./SUBMISSION_CHECKLIST.md).
7. Open one focused pull request.

Example folder:

```text
community-agents/your-agent-name/
```

Each submitted agent should contain:

```text
your-agent-name/
├── examples/
├── src/
├── test/
├── .env.example      # only when environment variables are used
├── .gitignore
├── package-lock.json
├── package.json
├── prompts.md        # when prompts or model instructions are used
├── resources.md
└── README.md
```

Your README should explain:

- What the agent does
- Who it is useful for
- How it works
- How to install and run it
- Whether it requires an AI model
- Whether it uses an external service
- Whether anything may cost money
- What permissions or information it needs
- Example inputs and outputs
- Known limitations
- Safety and privacy considerations

## Validate a contribution

The validator performs local, read-only checks. It does not install packages,
run contributed code, call an API, approve a submission, or modify files.

Install this folder's zero-dependency tooling:

```bash
cd community-agents
npm install
```

Validate the included miniature fixture:

```bash
npm run validate -- examples/sample-agent
```

Validate a proposed community agent:

```bash
npm run validate -- ./your-agent-name
```

Add `--json` for machine-readable output:

```bash
npm run validate -- ./your-agent-name --json
```

`READY_FOR_HUMAN_REVIEW` means the automated checks passed. It is not approval,
and maintainers must still review the implementation and run its documented
tests safely.

## Contribution rules

Community agents should:

- Be understandable to beginners
- Include a free way to run or test the core idea
- Avoid exposing secrets or personal information
- Use testnets by default for blockchain actions
- Require clear approval before sensitive external actions
- Clearly document unfinished or experimental behaviour
- Keep each pull request focused on one community agent
- Include a lockfile and tests that do not require a live paid service
- Never commit `.env`, credentials, private keys, seed phrases, personal data,
  dependency folders, or generated output

## What the validator checks

- Folder naming
- Required files and directories
- Node.js ES module and script configuration
- Required README sections
- A documented free or offline path
- External-service and cost disclosure
- Test and lockfile presence
- Required `.gitignore` entries
- Remaining template markers
- Common secret patterns and committed `.env` files

Automated checks cannot prove that an agent is correct or safe. Human review
remains required for code behavior, dependencies, permissions, claims, privacy,
licensing, and external side effects.

## Test the validator

```bash
npm test
```

The test suite creates temporary local fixtures and never runs submitted agent
code or makes network requests.
