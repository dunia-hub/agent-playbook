export function validatePolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("Policy must be a JSON object.");
  }
  if (!Array.isArray(policy.supportedLanguages) || policy.supportedLanguages.length === 0) {
    throw new Error("Policy must list supportedLanguages.");
  }
  if (
    typeof policy.minimumLanguageConfidence !== "number" ||
    policy.minimumLanguageConfidence < 0 ||
    policy.minimumLanguageConfidence > 1
  ) {
    throw new Error("minimumLanguageConfidence must be between 0 and 1.");
  }
  if (!Array.isArray(policy.highRiskRules)) {
    throw new Error("Policy highRiskRules must be an array.");
  }
  if (!policy.escalationReplies || typeof policy.escalationReplies !== "object") {
    throw new Error("Policy escalationReplies are required.");
  }
  for (const language of policy.supportedLanguages) {
    if (typeof policy.escalationReplies[language] !== "string") {
      throw new Error(`Missing escalation reply for ${language}.`);
    }
  }
  return policy;
}

export function assessEscalation({ analysis, redactedText, detectedTypes, matches, policy }) {
  const reasons = [];
  if (!policy.supportedLanguages.includes(analysis.language)) {
    reasons.push(`Unsupported language: ${analysis.language}.`);
  }
  if (analysis.confidence < policy.minimumLanguageConfidence) {
    reasons.push("Language confidence is below the configured threshold.");
  }
  if (analysis.urgency === "critical") {
    reasons.push("The message was classified as critical urgency.");
  }
  if (detectedTypes.includes("PAYMENT_CARD") || detectedTypes.includes("SECRET")) {
    reasons.push("Sensitive payment or secret material was detected and redacted.");
  }

  const normalizedText = redactedText.toLocaleLowerCase();
  for (const rule of policy.highRiskRules) {
    if (
      rule?.label &&
      Array.isArray(rule.terms) &&
      rule.terms.some((term) => normalizedText.includes(String(term).toLocaleLowerCase()))
    ) {
      reasons.push(`High-risk rule matched: ${rule.label}.`);
    }
  }
  if (matches.length === 0) reasons.push("No grounded knowledge-base answer was found.");

  return { needsHuman: reasons.length > 0, reasons };
}
