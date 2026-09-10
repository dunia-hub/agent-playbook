import test from "node:test";
import assert from "node:assert/strict";
import { extractTextMessage, isDuplicateMessage } from "../src/webhook.js";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "business-phone" },
            messages: [
              {
                from: "254711111111",
                id: "wamid.demo",
                timestamp: "1789020000",
                type: "text",
                text: { body: "  Hello support  " },
              },
            ],
          },
        },
      ],
    },
  ],
};

test("webhook: extracts one WhatsApp text message", () => {
  assert.deepEqual(extractTextMessage(payload), {
    messageId: "wamid.demo",
    from: "254711111111",
    text: "Hello support",
    timestamp: "1789020000",
    businessPhoneNumberId: "business-phone",
  });
});

test("webhook: rejects non-WhatsApp payloads", () => {
  assert.throws(() => extractTextMessage({ object: "other" }), /not a WhatsApp/);
});

test("webhook: rejects payloads with no message", () => {
  assert.throws(
    () => extractTextMessage({ object: "whatsapp_business_account", entry: [] }),
    /no message/
  );
});

test("webhook: rejects unsupported message types", () => {
  const imagePayload = structuredClone(payload);
  imagePayload.entry[0].changes[0].value.messages[0].type = "image";
  assert.throws(() => extractTextMessage(imagePayload), /text messages only/);
});

test("webhook: detects duplicate message IDs", () => {
  assert.equal(
    isDuplicateMessage("wamid.demo", { processedMessageIds: ["wamid.demo"] }),
    true
  );
  assert.equal(isDuplicateMessage("wamid.new", null), false);
});

test("webhook: validates the processed-message file", () => {
  assert.throws(() => isDuplicateMessage("wamid.demo", {}), /processedMessageIds/);
});
