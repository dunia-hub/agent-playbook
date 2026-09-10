# Community Agent Submission Checklist

Copy this checklist into your pull request and complete it honestly.

## Purpose and scope

- [ ] The agent solves one clear problem.
- [ ] The folder name is lowercase and hyphenated.
- [ ] The pull request contains one community agent and no unrelated changes.

## Running and testing

- [ ] The README includes complete installation and run commands.
- [ ] A free or offline path can demonstrate the core idea.
- [ ] Example inputs and expected outputs are included.
- [ ] Automated tests cover normal, invalid, and safety-sensitive behavior.
- [ ] `npm test` passes without requiring a live paid service.
- [ ] `package-lock.json` is included.

## Safety and privacy

- [ ] External actions are previewed before execution.
- [ ] Sensitive or irreversible actions require explicit user approval.
- [ ] Blockchain examples use testnets by default.
- [ ] Inputs, model output, tool results, and external responses are validated.
- [ ] No `.env`, credentials, private keys, seed phrases, or personal data are committed.
- [ ] Generated output and dependency folders are ignored.

## Services and costs

- [ ] Every model, API, wallet, network, database, and external service is documented.
- [ ] Required permissions and transmitted data are explained.
- [ ] Possible costs and current free-tier limitations are stated.
- [ ] The agent handles unavailable or failed external services safely.

## Documentation and review

- [ ] The README describes how the agent works, its limitations, and its safety boundary.
- [ ] Prompt instructions and resource links are included where applicable.
- [ ] All template markers and placeholder content were removed.
- [ ] `npm run validate -- ./your-agent-name` reports `READY_FOR_HUMAN_REVIEW`.
- [ ] I reviewed the staged diff for secrets and unrelated files.

Passing this checklist and the validator does not guarantee acceptance. A
maintainer will still review the code, dependencies, claims, and risk profile.
