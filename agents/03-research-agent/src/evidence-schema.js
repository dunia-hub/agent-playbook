const stringArray = {
  type: "array",
  items: { type: "string" },
};

const finding = {
  type: "object",
  properties: {
    claim: { type: "string" },
    support: { type: "string", enum: ["direct", "partial"] },
    taskIds: stringArray,
    excerpt: { type: "string" },
  },
  required: ["claim", "support", "taskIds", "excerpt"],
  additionalProperties: false,
};

const sourceAssessment = {
  type: "object",
  properties: {
    sourceId: { type: "string" },
    sourceType: {
      type: "string",
      enum: [
        "government",
        "academic",
        "official documentation",
        "company",
        "journalism",
        "nonprofit",
        "reference",
        "blog",
        "other",
      ],
    },
    relevance: { type: "string", enum: ["high", "medium", "low"] },
    quality: { type: "string", enum: ["strong", "mixed", "weak"] },
    qualityReasons: stringArray,
    findings: { type: "array", items: finding },
    limitations: stringArray,
  },
  required: [
    "sourceId",
    "sourceType",
    "relevance",
    "quality",
    "qualityReasons",
    "findings",
    "limitations",
  ],
  additionalProperties: false,
};

const conflict = {
  type: "object",
  properties: {
    topic: { type: "string" },
    sourceIds: stringArray,
    description: { type: "string" },
  },
  required: ["topic", "sourceIds", "description"],
  additionalProperties: false,
};

export const EVIDENCE_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "research_evidence_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        sourceAssessments: {
          type: "array",
          items: sourceAssessment,
        },
        conflicts: { type: "array", items: conflict },
        gaps: stringArray,
      },
      required: ["sourceAssessments", "conflicts", "gaps"],
      additionalProperties: false,
    },
  },
};
