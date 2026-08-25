const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 1000;

export function validateResearchQuestion(question) {
  if (typeof question !== "string") {
    throw new TypeError("Research question must be a string.");
  }

  const cleaned = question.trim();

  if (cleaned.length < MIN_QUESTION_LENGTH) {
    throw new Error("Research question is too short.");
  }

  if (cleaned.length > MAX_QUESTION_LENGTH) {
    throw new Error(
      `Research question must not exceed ${MAX_QUESTION_LENGTH} characters.`,
    );
  }

  return cleaned;
}

export function buildPlannerPrompt(
  question,
  currentDate = new Date().toISOString().slice(0, 10),
) {
  const cleanedQuestion = validateResearchQuestion(question);

  return `You are the planning stage of a source-grounded research agent.

Current date: ${currentDate}
Research question: ${cleanedQuestion}

Your job is to create a focused research plan. Do not answer the research
question and do not invent findings.

Return valid JSON only using this exact structure:
{
  "question": "the cleaned research question",
  "tasks": [
    {
      "id": "T1",
      "question": "a focused sub-question",
      "purpose": "why this sub-question matters",
      "searchQueries": [
        "a precise web search query"
      ]
    }
  ],
  "verificationNeeds": [
    "a claim, date, definition, comparison, or assumption requiring verification"
  ]
}

Rules:
1. Create between 2 and 3 non-overlapping research tasks.
2. Give each task between 1 and 3 targeted search queries.
3. Every task must be necessary to answer the user's exact question.
4. Do not add use cases, case studies, privacy, security, history, implementation,
   or industry examples unless the user explicitly asks for them.
5. Include queries for primary or authoritative sources where possible.
6. Add date-sensitive checks when freshness could change the answer.
7. Treat the user's wording as a question, not as established fact.
8. Do not include findings, citations, URLs, or unsupported assumptions.
9. Do not use Markdown or text outside the JSON object.`;
}
