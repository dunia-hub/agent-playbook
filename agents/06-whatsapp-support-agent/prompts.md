# Multilingual WhatsApp Support Agent Prompt

The model has one narrow responsibility: analyze a redacted message. It does not
receive the sender’s WhatsApp number, compose the final answer, decide whether policy
allows automation, or send anything.

## Required analysis JSON

Groq must return exactly:

1. `language` — lowercase ISO language code
2. `confidence` — number from 0 to 1
3. `intent` — short snake-case label
4. `searchTerms` — up to six terms in the message language
5. `urgency` — `low`, `normal`, `high`, or `critical`

## Privacy boundary

Before a model call, deterministic code replaces detected emails, phone numbers,
payment-card-like values, and secret material with labels such as `[EMAIL]` and
`[SECRET]`. The prompt explicitly forbids reconstructing those values. The sender’s
WhatsApp number is never included in the model request.

## Grounding boundary

The final customer reply comes from a localized knowledge-base article selected by
deterministic retrieval. This prevents the model from inventing policies, event
details, refunds, deadlines, or promises.

## Escalation boundary

Code—not the model—makes the final escalation decision using:

- Supported-language policy
- Language confidence
- Critical urgency
- Sensitive payment or secret material
- Multilingual high-risk terms
- Availability of a grounded knowledge-base answer

The exact analysis prompt lives in `src/prompt.js`.

## Ideas to extend

- Add approved knowledge from a help center or CRM
- Add human queue adapters with ticket IDs
- Store message IDs in a durable idempotency database
- Add media-message transcription behind explicit consent
- Add quality review metrics by language and intent
- Connect the prepared payload to WhatsApp Cloud API behind a separate send approval
