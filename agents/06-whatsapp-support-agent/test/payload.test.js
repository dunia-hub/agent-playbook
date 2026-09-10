import test from "node:test";
import assert from "node:assert/strict";
import { createWhatsAppPayload } from "../src/payload.js";

test("payload: prepares a WhatsApp reply without sending it", () => {
  const payload = createWhatsAppPayload({
    inbound: { from: "254711111111", messageId: "wamid.demo" },
    reply: "Karibu!",
  });
  assert.deepEqual(payload, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "254711111111",
    context: { message_id: "wamid.demo" },
    type: "text",
    text: { preview_url: false, body: "Karibu!" },
  });
});

test("payload: requires an inbound recipient and context", () => {
  assert.throws(
    () => createWhatsAppPayload({ inbound: {}, reply: "Hello" }),
    /sender and message id/
  );
});

test("payload: rejects empty replies", () => {
  assert.throws(
    () =>
      createWhatsAppPayload({
        inbound: { from: "254711111111", messageId: "wamid.demo" },
        reply: " ",
      }),
    /non-empty reply/
  );
});

test("payload: enforces the WhatsApp text length limit", () => {
  assert.throws(
    () =>
      createWhatsAppPayload({
        inbound: { from: "254711111111", messageId: "wamid.demo" },
        reply: "x".repeat(4097),
      }),
    /4096/
  );
});
