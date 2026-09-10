export function createWhatsAppPayload({ inbound, reply }) {
  if (!inbound?.from || !inbound?.messageId) {
    throw new Error("Inbound sender and message id are required.");
  }
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("A non-empty reply is required.");
  }
  if (reply.length > 4096) {
    throw new Error("Reply exceeds the WhatsApp text-message limit of 4096 characters.");
  }
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: inbound.from,
    context: { message_id: inbound.messageId },
    type: "text",
    text: { preview_url: false, body: reply.trim() },
  };
}
