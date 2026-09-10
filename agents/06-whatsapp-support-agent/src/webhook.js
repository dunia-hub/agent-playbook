export function extractTextMessage(payload) {
  if (!payload || typeof payload !== "object" || payload.object !== "whatsapp_business_account") {
    throw new Error("Input is not a WhatsApp Business webhook payload.");
  }

  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) throw new Error("Webhook contains no message.");
  if (message.type !== "text" || typeof message.text?.body !== "string") {
    throw new Error("This workshop agent supports text messages only.");
  }
  if (!message.id || !message.from || !message.text.body.trim()) {
    throw new Error("Message id, sender, and non-empty text are required.");
  }

  return {
    messageId: String(message.id),
    from: String(message.from),
    text: message.text.body.trim(),
    timestamp: message.timestamp ? String(message.timestamp) : null,
    businessPhoneNumberId: value.metadata?.phone_number_id
      ? String(value.metadata.phone_number_id)
      : null,
  };
}

export function isDuplicateMessage(messageId, processedData) {
  if (!processedData) return false;
  if (!Array.isArray(processedData.processedMessageIds)) {
    throw new Error("Processed-message file must contain processedMessageIds.");
  }
  return processedData.processedMessageIds.includes(messageId);
}
