# Security Policy

Security is important across every Agent Playbook example and community contribution.

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub's private security reporting feature or contact the Dunia Hub maintainers privately.

Include:

- A clear description of the issue
- The affected agent, example, or file
- Steps to reproduce it
- The possible impact
- Any suggested fix

## Sensitive information

Never commit:

- API keys
- Access tokens
- Passwords
- Private wallet keys
- Seed phrases
- Personal customer information
- Production credentials

Use environment variables and provide an `.env.example` file where configuration is required.

## Blockchain safety

Blockchain examples should use testnets by default.

Agents must not sign transactions, transfer assets, approve spending, or interact with mainnet funds without clear user approval.

## External actions

Agents that send messages, create bookings, make payments, or perform other external actions must:

- Explain the proposed action
- Show important details before execution
- Require clear user approval
- Record failures honestly
- Avoid repeating failed actions automatically

## Supported versions

Security fixes will be applied to the latest version of the repository.
