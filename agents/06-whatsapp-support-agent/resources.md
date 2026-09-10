# Resources

## WhatsApp Cloud API

- [WhatsApp Cloud API overview](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/)
- [Messages reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)

Meta may require a business account and may charge for production messaging. This
workshop agent makes no WhatsApp API calls and needs no Meta credentials.

## Groq

- [Groq Console](https://console.groq.com/keys)
- [Groq documentation](https://console.groq.com/docs)
- [Groq JavaScript SDK](https://www.npmjs.com/package/groq-sdk)

The offline workflow uses a saved analysis and requires no model key.

## Node.js

- [ECMAScript modules](https://nodejs.org/api/esm.html)
- [Built-in test runner](https://nodejs.org/api/test.html)
- [Cryptographic hashing](https://nodejs.org/api/crypto.html)
- [Unicode property escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)

## Safety concepts

- **Data minimization:** the model sees only redacted message text.
- **Grounded replies:** customer-facing answers come from localized approved content.
- **Human escalation:** risky, uncertain, unsupported, or ungrounded requests are not
  automated.
- **Idempotency:** previously processed message IDs are ignored.
- **Approval gate:** a WhatsApp-shaped payload is written only after `--approve` and
  is never sent by this agent.

## Dunia Hub

- [Dunia Hub](https://duniahub.xyz)
- The Agent Playbook is a practical workshop series for building understandable,
  testable agents with free or local tooling.
