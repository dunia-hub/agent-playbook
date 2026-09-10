export function composeReply({ analysis, matches, escalation, policy }) {
  if (escalation.needsHuman) {
    return (
      policy.escalationReplies[analysis.language] ||
      policy.escalationReplies[policy.fallbackLanguage] ||
      "A human support teammate needs to review this message."
    );
  }

  const topMatch = matches[0]?.article;
  if (!topMatch) throw new Error("Cannot compose an automated reply without knowledge.");
  return topMatch.answer;
}
