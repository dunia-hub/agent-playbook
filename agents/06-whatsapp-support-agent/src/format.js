export function formatSupportPreview({
  inbound,
  senderHash,
  privacy,
  analysis,
  matches,
  escalation,
  reply,
  duplicate = false,
}) {
  if (duplicate) {
    return [
      "# WhatsApp Support Preview",
      "",
      "Status: DUPLICATE_IGNORED",
      `Message ID: ${inbound.messageId}`,
      `Sender: ${senderHash}`,
      "",
      "This message ID was already processed. No reply was prepared or sent.",
    ].join("\n");
  }

  return [
    "# WhatsApp Support Preview",
    "",
    `Status: ${escalation.needsHuman ? "HUMAN_REVIEW_REQUIRED" : "READY_TO_REVIEW"}`,
    `Message ID: ${inbound.messageId}`,
    `Sender: ${senderHash}`,
    `Language: ${analysis.language} (${Math.round(analysis.confidence * 100)}% confidence)`,
    `Intent: ${analysis.intent}`,
    `Urgency: ${analysis.urgency}`,
    "",
    "## Privacy",
    "",
    `Redacted message: ${privacy.redactedText}`,
    `Sensitive types removed: ${privacy.detectedTypes.join(", ") || "None"}`,
    "",
    "## Knowledge Used",
    "",
    ...(matches.length
      ? matches
          .slice(0, 1)
          .map(({ article, score }) => `- ${article.id}: ${article.title} (score ${score})`)
      : ["- None"]),
    "",
    "## Reply Preview",
    "",
    reply,
    "",
    "## Escalation",
    "",
    ...(escalation.reasons.length
      ? escalation.reasons.map((reason) => `- ${reason}`)
      : ["- Not required"]),
    "",
    "## Delivery",
    "",
    escalation.needsHuman
      ? "Automated approval is blocked. A person must review the conversation."
      : "Not sent. Rerun with --approve only after reviewing this reply.",
  ].join("\n");
}
