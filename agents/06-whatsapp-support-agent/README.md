# Multilingual WhatsApp Support Agent

Dunia Hub Agent Playbook 06.

This Node.js agent processes a WhatsApp Cloud API-style webhook, protects customer
data, understands support intent across languages, retrieves an approved localized
answer, applies escalation rules, and prepares a reply for review. It only creates a
WhatsApp-shaped outbound payload after explicit approval, and it never sends it.

## What the agent does

- Parses a realistic WhatsApp Business text-message webhook
- Hashes the sender for previews instead of exposing their phone number
- Redacts emails, phone numbers, payment-card-like values, and secret material
- Supports English, Swahili, and French in the included example policy
- Uses Groq only for structured language, intent, search-term, and urgency analysis
- Supports a completely offline analysis mode with no API key
- Retrieves answers from a localized, approved knowledge base
- Escalates unsupported, uncertain, risky, sensitive, or ungrounded messages
- Detects duplicate webhook deliveries from previously processed message IDs
- Requires `--approve` before writing an outbound payload

It does not call WhatsApp, send messages, create support tickets, or resolve high-risk
requests automatically.

## Stack

- Node.js 20 or newer with ES modules
- Built-in `crypto` for one-way sender hashing
- Unicode-aware deterministic knowledge retrieval
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) for optional message analysis
- [dotenv](https://www.npmjs.com/package/dotenv) for local configuration
- Node's built-in test runner (`node --test`)

No agent framework, database, paid model, Meta account, WhatsApp token, or production
phone number is required.

## Setup

Install dependencies:

```bash
npm install
```

The offline example needs no `.env`. To analyze new messages with Groq:

```bash
cp .env.example .env
```

Add a free Groq developer key. Never commit `.env` or place WhatsApp access tokens,
private keys, or customer data in the repository.

## Run the complete workflow offline

```bash
npm start -- \
  --webhook examples/webhook.sw.json \
  --knowledge examples/knowledge-base.json \
  --policy examples/policy.json \
  --analysis examples/analysis.sw.json
```

The sample Swahili question asks when a workshop’s Google Meet link will arrive. The
agent retrieves the Swahili knowledge article and returns a `READY_TO_REVIEW` preview.
The sender appears only as a short SHA-256-derived identifier.

## Analyze a new message with Groq

After adding `GROQ_API_KEY` to `.env`, omit `--analysis`:

```bash
npm start -- \
  --webhook examples/webhook.sw.json \
  --knowledge examples/knowledge-base.json \
  --policy examples/policy.json
```

Only the redacted text and supported-language codes are sent to Groq. The sender’s
number, webhook metadata, and full knowledge base are not included.

## Check webhook idempotency

Production webhooks may retry delivery. Supply a local record of processed IDs:

```bash
npm start -- \
  --webhook examples/webhook.sw.json \
  --knowledge examples/knowledge-base.json \
  --policy examples/policy.json \
  --analysis examples/analysis.sw.json \
  --processed examples/processed-message-ids.json
```

If the incoming message ID is already listed, the agent returns
`DUPLICATE_IGNORED` and prepares no reply.

## Approve a reply payload

First review the preview. If its status is `READY_TO_REVIEW`, rerun with explicit
approval:

```bash
npm start -- \
  --webhook examples/webhook.sw.json \
  --knowledge examples/knowledge-base.json \
  --policy examples/policy.json \
  --analysis examples/analysis.sw.json \
  --approve \
  --output output/whatsapp-reply.json
```

The ignored `output/` file follows the WhatsApp text-message payload shape, including
the original message ID as reply context. It contains the recipient number, so treat
it as private local data. The agent does not transmit it.

Approval is blocked whenever `HUMAN_REVIEW_REQUIRED` is active.

## Escalation rules

The example policy escalates when:

- The detected language is unsupported
- Language confidence is below the configured threshold
- Urgency is critical
- Payment-card-like or secret material is detected and redacted
- A multilingual high-risk term is matched
- No localized knowledge answer can be retrieved

Escalations use a localized acknowledgement but are not automatically approved or
sent.

## Run tests

```bash
npm test
```

The offline suite tests webhook parsing, duplicate handling, privacy redaction, sender
hashing, model-response validation, multilingual retrieval, accented text, escalation
policy, localized replies, payload limits, preview behavior, and mocked Groq calls.
No test contacts Groq, Meta, WhatsApp, or any other external service.

## Project structure

```text
06-whatsapp-support-agent/
├── examples/
│   ├── analysis.sw.json
│   ├── knowledge-base.json
│   ├── policy.json
│   ├── processed-message-ids.json
│   └── webhook.sw.json
├── src/
│   ├── analysis.js
│   ├── arguments.js
│   ├── files.js
│   ├── format.js
│   ├── groq.js
│   ├── index.js
│   ├── knowledge.js
│   ├── payload.js
│   ├── policy.js
│   ├── privacy.js
│   ├── prompt.js
│   ├── reply.js
│   └── webhook.js
├── test/
│   ├── analysis.test.js
│   ├── arguments.test.js
│   ├── format.test.js
│   ├── groq.test.js
│   ├── knowledge.test.js
│   ├── payload.test.js
│   ├── policy.test.js
│   ├── privacy.test.js
│   ├── reply.test.js
│   └── webhook.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prompts.md
├── README.md
└── resources.md
```

## Safety boundaries

- Only text messages are accepted in this workshop version.
- Raw sender numbers never appear in previews or model requests.
- Sensitive values are redacted before model analysis.
- Model output is untrusted and strictly validated.
- The model cannot write the customer reply or override escalation policy.
- Automated replies require localized knowledge evidence.
- Duplicate message IDs are ignored.
- High-risk replies cannot pass the approval gate.
- No networking or message-send implementation exists.

## Limitations

Regex redaction reduces accidental exposure but cannot identify every form of personal
or secret information. Keyword retrieval is intentionally understandable and may miss
paraphrases. A production system would need durable message-ID storage, authenticated
webhook verification, access controls, retention policies, human queue integration,
approved live knowledge sources, monitoring, and a separately authorized send step.
