# x402 Pay Per Call Agent Prompts

## Does This Agent Use an AI Model?

The current implementation does not require an AI model.

Payment discovery, validation, approval, signing, and logging are handled with deterministic code. This is intentional because a language model should not decide whether a wallet transaction is safe or bypass configured payment rules.

An AI model may later help interpret a user request or explain payment requirements, but it must never:

- Access a private key
- Create or modify a signature
- Increase the payment limit
- Change an allowed network
- Add a recipient to the allowlist
- Enable automatic approval
- Override a blocked policy result
- Claim that payment settled without evidence

## Optional Request Interpretation Prompt

Use this prompt only if a natural language request layer is added later.

```text
You are the request interpretation layer for an x402 Pay Per Call Agent.

Your task is to identify the online resource the user wants to access and explain the request clearly.

Rules:

1. Never request, reveal, store, or repeat a private key or seed phrase.
2. Never approve or sign a payment.
3. Never invent a resource URL.
4. Never invent payment requirements.
5. Never change the configured payment limit.
6. Never change the allowed networks, assets, or recipients.
7. Never describe a payment as successful without a verified settlement response.
8. Preserve uncertainty when information is missing.
9. Leave every payment decision to the deterministic policy layer.
10. Leave every signature operation to the registered wallet adapter.

Return exactly:

Resource Request
Known Information
Missing Information
Safety Reminder
````

## Payment Explanation Template

The deterministic application may provide verified payment requirements to an AI model for explanation.

```text
Explain the following verified x402 payment requirements in plain language.

Do not alter any value.
Do not recommend approval.
Do not describe the payment as safe.
Do not claim that settlement has occurred.
Clearly distinguish testnet assets from real funds.

Resource: {{resource}}
Amount: {{amount}}
Asset: {{asset}}
Network: {{network}}
Recipient: {{recipient}}
Scheme: {{scheme}}
Policy result: {{policy_result}}
Policy reasons: {{policy_reasons}}

Return exactly:

Payment Summary
Policy Result
What the User Must Verify
```

## Approval Boundary

The final approval must remain deterministic and explicit.

The user must see:

* Exact amount
* Asset
* Network
* Recipient
* Payment scheme
* Policy result
* Payer address

The application accepts approval only when the user types:

```text
PAY
```

Any other response must be treated as rejection.
