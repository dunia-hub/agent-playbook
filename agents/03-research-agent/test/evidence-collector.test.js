import test from "node:test";
import assert from "node:assert/strict";

import { collectEvidence } from "../src/evidence-collector.js";

function createPlan() {
  return {
    question: "How do research agents verify claims?",
    tasks: [
      {
        id: "T1",
        question: "Which verification methods are used?",
        purpose: "Identify verification methods.",
        searchQueries: ["alpha first", "alpha second"],
      },
      {
        id: "T2",
        question: "What are the limitations?",
        purpose: "Identify limitations.",
        searchQueries: ["beta first", "beta second"],
      },
    ],
    verificationNeeds: ["Verify that claims match their sources."],
  };
}

function pageFor(url) {
  return {
    title: `Page for ${url}`,
    url,
    domain: new URL(url).hostname,
    description: "A useful source.",
    publishedAt: "2026-08-01",
    content:
      "This is sufficiently detailed extracted evidence for the research agent.",
  };
}

test("schedules queries fairly across research tasks", async () => {
  const searched = [];

  async function fakeSearch(query) {
    searched.push(query);
    return [];
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: async () => {
      throw new Error("Reader should not be called.");
    },
    maxQueries: 3,
  });

  assert.deepEqual(searched, [
    "alpha first",
    "beta first",
    "alpha second",
  ]);

  assert.deepEqual(
    result.scheduledQueries.map((item) => item.taskId),
    ["T1", "T2", "T1"],
  );
});

test("deduplicates sources and preserves their task connections", async () => {
  async function fakeSearch(query) {
    if (query === "alpha first") {
      return [
        {
          title: "Shared source",
          url: "https://example.com/shared",
          snippet: "Shared evidence.",
          query,
        },
      ];
    }

    if (query === "beta first") {
      return [
        {
          title: "Shared source again",
          url: "https://example.com/shared",
          snippet: "The same evidence.",
          query,
        },
      ];
    }

    return [];
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: async (url) => pageFor(url),
    maxQueries: 2,
  });

  assert.equal(result.sources.length, 1);
  assert.deepEqual(result.sources[0].taskIds, ["T1", "T2"]);
  assert.deepEqual(result.sources[0].queries, [
    "alpha first",
    "beta first",
  ]);
});

test("assigns stable source IDs and respects the source limit", async () => {
  async function fakeSearch(query) {
    return [
      {
        title: `${query} result one`,
        url: `https://example.com/${encodeURIComponent(query)}/one`,
        snippet: "First result.",
        query,
      },
      {
        title: `${query} result two`,
        url: `https://example.com/${encodeURIComponent(query)}/two`,
        snippet: "Second result.",
        query,
      },
    ];
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: async (url) => pageFor(url),
    maxQueries: 2,
    maxSources: 2,
  });

  assert.equal(result.sources.length, 2);
  assert.deepEqual(
    result.sources.map((source) => source.id),
    ["S1", "S2"],
  );
});

test("reads candidate sources fairly across research tasks", async () => {
  async function fakeSearch(query) {
    const prefix = query.startsWith("alpha") ? "alpha" : "beta";
    return [1, 2, 3].map((number) => ({
      title: `${prefix} result ${number}`,
      url: `https://example.com/${prefix}/${number}`,
      snippet: `${prefix} evidence`,
    }));
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: async (url) => pageFor(url),
    maxQueries: 2,
    maxSources: 2,
  });

  assert.deepEqual(
    result.sources.map((source) => source.taskIds),
    [["T1"], ["T2"]],
  );
});

test("records a search failure and continues researching", async () => {
  async function fakeSearch(query) {
    if (query === "alpha first") {
      throw new Error("Search temporarily unavailable.");
    }

    return [];
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: async (url) => pageFor(url),
    maxQueries: 2,
  });

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].stage, "search");
  assert.equal(result.failures[0].taskId, "T1");
  assert.match(result.failures[0].error, /temporarily unavailable/);
});

test("records an unreadable page and continues to the next source", async () => {
  async function fakeSearch() {
    return [
      {
        title: "Blocked source",
        url: "https://blocked.example/report",
        snippet: "A blocked page.",
      },
      {
        title: "Readable source",
        url: "https://readable.example/report",
        snippet: "A readable page.",
      },
    ];
  }

  async function fakeRead(url) {
    if (url.includes("blocked")) {
      throw new Error("Source request failed with status 403.");
    }

    return pageFor(url);
  }

  const result = await collectEvidence({
    plan: createPlan(),
    searchImpl: fakeSearch,
    readImpl: fakeRead,
    maxQueries: 1,
    maxSources: 2,
  });

  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].id, "S1");
  assert.equal(
    result.sources[0].url,
    "https://readable.example/report",
  );
  assert.equal(result.failures[0].stage, "read");
});

test("rejects invalid collection limits", async () => {
  await assert.rejects(
    () =>
      collectEvidence({
        plan: createPlan(),
        searchImpl: async () => [],
        readImpl: async () => ({}),
        maxSources: 0,
      }),
    /maxSources must be an integer from 1 to 10/,
  );
});
