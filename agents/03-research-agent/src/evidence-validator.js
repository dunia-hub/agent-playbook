const SOURCE_TYPES = new Set([
  "government",
  "academic",
  "official documentation",
  "company",
  "journalism",
  "nonprofit",
  "reference",
  "blog",
  "other",
]);

const RELEVANCE_LEVELS = new Set(["high", "medium", "low"]);
const QUALITY_LEVELS = new Set(["strong", "mixed", "weak"]);
const SUPPORT_LEVELS = new Set(["direct", "partial"]);

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function requireExactKeys(value, expectedKeys, field) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();

  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      `${field} must contain exactly: ${expectedKeys.join(", ")}.`,
    );
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function requireStringArray(value, field, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${field} must be a${allowEmpty ? "" : " non-empty"} array.`);
  }

  return value.map((item, index) =>
    requireString(item, `${field}[${index}]`),
  );
}

function normalizeText(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function parseEvidenceAnalysis(response) {
  if (typeof response !== "string" || response.trim() === "") {
    throw new Error(
      "Evidence analysis response must be a non-empty string.",
    );
  }

  const trimmed = response.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      return JSON.parse(withoutFence);
    } catch {
      const firstBrace = withoutFence.indexOf("{");
      const lastBrace = withoutFence.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(
            withoutFence.slice(firstBrace, lastBrace + 1),
          );
        } catch {
          throw new Error(
            "Evidence analysis response is not valid JSON.",
          );
        }
      }

      throw new Error(
        "Evidence analysis response is not valid JSON.",
      );
    }
  }
}

export function validateEvidenceAnalysis(analysis, sources) {
  if (!isPlainObject(analysis)) {
    throw new Error("Evidence analysis must be an object.");
  }

  if (!Array.isArray(sources) || sources.length < 2) {
    throw new Error("At least 2 sources are required for validation.");
  }

  const analyzedSources = sources.slice(0, 5);
  const sourceById = new Map(
    analyzedSources.map((source) => [source.id, source]),
  );

  requireExactKeys(
    analysis,
    ["sourceAssessments", "conflicts", "gaps"],
    "Evidence analysis",
  );

  if (
    !Array.isArray(analysis.sourceAssessments) ||
    analysis.sourceAssessments.length !== analyzedSources.length
  ) {
    throw new Error(
      "Evidence analysis must assess every supplied source exactly once.",
    );
  }

  const seenSourceIds = new Set();

  const sourceAssessments = analysis.sourceAssessments.map(
    (assessment, assessmentIndex) => {
      const field = `sourceAssessments[${assessmentIndex}]`;

      if (!isPlainObject(assessment)) {
        throw new Error(`${field} must be an object.`);
      }

      requireExactKeys(
        assessment,
        [
          "sourceId",
          "sourceType",
          "relevance",
          "quality",
          "qualityReasons",
          "findings",
          "limitations",
        ],
        field,
      );

      const sourceId = requireString(
        assessment.sourceId,
        `${field}.sourceId`,
      );

      if (!sourceById.has(sourceId)) {
        throw new Error(`${field} contains an unknown source ID.`);
      }

      if (seenSourceIds.has(sourceId)) {
        throw new Error(`Source ${sourceId} was assessed more than once.`);
      }

      seenSourceIds.add(sourceId);

      const sourceType = requireString(
        assessment.sourceType,
        `${field}.sourceType`,
      );

      if (!SOURCE_TYPES.has(sourceType)) {
        throw new Error(`${field}.sourceType is not allowed.`);
      }

      const relevance = requireString(
        assessment.relevance,
        `${field}.relevance`,
      );

      if (!RELEVANCE_LEVELS.has(relevance)) {
        throw new Error(`${field}.relevance is not allowed.`);
      }

      const quality = requireString(
        assessment.quality,
        `${field}.quality`,
      );

      if (!QUALITY_LEVELS.has(quality)) {
        throw new Error(`${field}.quality is not allowed.`);
      }

      const qualityReasons = requireStringArray(
        assessment.qualityReasons,
        `${field}.qualityReasons`,
        { allowEmpty: false },
      );

      if (!Array.isArray(assessment.findings)) {
        throw new Error(`${field}.findings must be an array.`);
      }

      const source = sourceById.get(sourceId);
      const normalizedContent = normalizeText(
        [source.title, source.description, source.content]
          .filter(Boolean)
          .join(" "),
      );

      const findings = assessment.findings.map(
        (finding, findingIndex) => {
          const findingField = `${field}.findings[${findingIndex}]`;

          if (!isPlainObject(finding)) {
            throw new Error(`${findingField} must be an object.`);
          }

          requireExactKeys(
            finding,
            ["claim", "support", "taskIds", "excerpt"],
            findingField,
          );

          const claim = requireString(
            finding.claim,
            `${findingField}.claim`,
          );
          const support = requireString(
            finding.support,
            `${findingField}.support`,
          );
          const excerpt = requireString(
            finding.excerpt,
            `${findingField}.excerpt`,
          );
          const taskIds = requireStringArray(
            finding.taskIds,
            `${findingField}.taskIds`,
            { allowEmpty: false },
          );

          if (new Set(taskIds).size !== taskIds.length) {
            throw new Error(`${findingField}.taskIds contains duplicates.`);
          }

          const allowedTaskIds = new Set(source.taskIds || []);
          for (const taskId of taskIds) {
            if (!allowedTaskIds.has(taskId)) {
              throw new Error(
                `${findingField}.taskIds contains ${taskId}, which is not connected to source ${sourceId}.`,
              );
            }
          }

          if (!SUPPORT_LEVELS.has(support)) {
            throw new Error(`${findingField}.support is not allowed.`);
          }

          if (
            countWords(excerpt) > 20 ||
            !normalizedContent.includes(normalizeText(excerpt))
          ) {
            return null;
          }

          return {
            claim,
            support,
            taskIds,
            excerpt,
          };
        },
      ).filter(Boolean);

      return {
        sourceId,
        sourceType,
        relevance,
        quality,
        qualityReasons,
        findings,
        limitations: requireStringArray(
          assessment.limitations,
          `${field}.limitations`,
        ),
      };
    },
  );

  if (!Array.isArray(analysis.conflicts)) {
    throw new Error("conflicts must be an array.");
  }

  const conflicts = analysis.conflicts.map((conflict, index) => {
    const field = `conflicts[${index}]`;

    if (!isPlainObject(conflict)) {
      throw new Error(`${field} must be an object.`);
    }

    requireExactKeys(
      conflict,
      ["topic", "sourceIds", "description"],
      field,
    );

    const sourceIds = requireStringArray(
      conflict.sourceIds,
      `${field}.sourceIds`,
      { allowEmpty: false },
    );

    if (sourceIds.length < 2) {
      throw new Error(`${field} must reference at least 2 sources.`);
    }

    if (new Set(sourceIds).size !== sourceIds.length) {
      throw new Error(`${field} contains duplicate source IDs.`);
    }

    for (const sourceId of sourceIds) {
      if (!sourceById.has(sourceId)) {
        throw new Error(`${field} contains an unknown source ID.`);
      }
    }

    return {
      topic: requireString(conflict.topic, `${field}.topic`),
      sourceIds,
      description: requireString(
        conflict.description,
        `${field}.description`,
      ),
    };
  });

  const supportedFindingCount = sourceAssessments.reduce(
    (total, assessment) => total + assessment.findings.length,
    0,
  );

  if (supportedFindingCount === 0) {
    throw new Error(
      "Evidence analysis did not contain any verifiable findings.",
    );
  }

  return {
    sourceAssessments,
    conflicts,
    gaps: requireStringArray(analysis.gaps, "gaps"),
  };
}
