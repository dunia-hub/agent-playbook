function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function requireExactKeys(value, expectedKeys, field) {
  const actualKeys = Object.keys(value).sort();
  const requiredKeys = [...expectedKeys].sort();

  if (
    actualKeys.length !== requiredKeys.length ||
    actualKeys.some((key, index) => key !== requiredKeys[index])
  ) {
    throw new Error(
      `${field} must contain exactly: ${expectedKeys.join(", ")}.`,
    );
  }
}

export function parseResearchPlan(response) {
  if (typeof response !== "string" || response.trim() === "") {
    throw new Error("Research plan response must be a non-empty string.");
  }

  const trimmed = response.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
      } catch {
        // Use the consistent validation error below.
      }
    }

    throw new Error("Research plan response is not valid JSON.");
  }
}

export function validateResearchPlan(plan, expectedQuestion) {
  if (!isPlainObject(plan)) {
    throw new Error("Research plan must be an object.");
  }

  requireExactKeys(
    plan,
    ["question", "tasks", "verificationNeeds"],
    "Research plan",
  );

  const question = requireNonEmptyString(plan.question, "question");

  const preservedQuestion =
    expectedQuestion === undefined
      ? question
      : requireNonEmptyString(expectedQuestion, "expectedQuestion");

  if (!Array.isArray(plan.tasks) || plan.tasks.length < 2 || plan.tasks.length > 5) {
    throw new Error("Research plan must contain between 2 and 5 tasks.");
  }

  const scopedTasks = plan.tasks.slice(0, 3);

  const seenQueries = new Set();

  const tasks = scopedTasks.map((task, index) => {
    if (!isPlainObject(task)) {
      throw new Error(`tasks[${index}] must be an object.`);
    }

    requireExactKeys(
      task,
      ["id", "question", "purpose", "searchQueries"],
      `tasks[${index}]`,
    );

    const expectedId = `T${index + 1}`;
    const id = requireNonEmptyString(task.id, `tasks[${index}].id`);

    if (id !== expectedId) {
      throw new Error(`tasks[${index}].id must be ${expectedId}.`);
    }

    if (
      !Array.isArray(task.searchQueries) ||
      task.searchQueries.length < 1 ||
      task.searchQueries.length > 3
    ) {
      throw new Error(
        `${id} must contain between 1 and 3 search queries.`,
      );
    }

    const searchQueries = task.searchQueries.map((query, queryIndex) => {
      const cleaned = requireNonEmptyString(
        query,
        `${id}.searchQueries[${queryIndex}]`,
      );
      const normalized = cleaned.toLowerCase();

      if (seenQueries.has(normalized)) {
        throw new Error(`Duplicate search query: ${cleaned}`);
      }

      seenQueries.add(normalized);
      return cleaned;
    });

    return {
      id,
      question: requireNonEmptyString(task.question, `${id}.question`),
      purpose: requireNonEmptyString(task.purpose, `${id}.purpose`),
      searchQueries,
    };
  });

  if (
    !Array.isArray(plan.verificationNeeds) ||
    plan.verificationNeeds.length === 0
  ) {
    throw new Error(
      "Research plan must contain at least one verification need.",
    );
  }

  const verificationNeeds = plan.verificationNeeds.map((need, index) =>
    requireNonEmptyString(need, `verificationNeeds[${index}]`),
  );

  return {
    question: preservedQuestion,
    tasks,
    verificationNeeds,
  };
}
