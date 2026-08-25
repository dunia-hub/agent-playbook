import { searchWeb } from "./web-search.js";
import { readPage } from "./page-reader.js";

function requireIntegerInRange(value, minimum, maximum, field) {
  if (
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `${field} must be an integer from ${minimum} to ${maximum}.`,
    );
  }
}

function scheduleQueries(tasks, maxQueries) {
  const scheduled = [];
  const longestQueryList = Math.max(
    ...tasks.map((task) => task.searchQueries.length),
  );

  for (let queryIndex = 0; queryIndex < longestQueryList; queryIndex += 1) {
    for (const task of tasks) {
      const query = task.searchQueries[queryIndex];

      if (query) {
        scheduled.push({
          taskId: task.id,
          query,
        });
      }

      if (scheduled.length === maxQueries) {
        return scheduled;
      }
    }
  }

  return scheduled;
}

function orderCandidatesByTask(tasks, candidates) {
  const candidatesByTask = tasks.map((task) =>
    candidates.filter((candidate) => candidate.taskIds.includes(task.id)),
  );
  const ordered = [];
  const seenUrls = new Set();
  const longestList = Math.max(...candidatesByTask.map((items) => items.length));

  for (let index = 0; index < longestList; index += 1) {
    for (const items of candidatesByTask) {
      const candidate = items[index];
      if (candidate && !seenUrls.has(candidate.url)) {
        seenUrls.add(candidate.url);
        ordered.push(candidate);
      }
    }
  }

  for (const candidate of candidates) {
    if (!seenUrls.has(candidate.url)) ordered.push(candidate);
  }

  return ordered;
}

export async function collectEvidence({
  plan,
  searchImpl = searchWeb,
  readImpl = readPage,
  maxQueries = 8,
  resultsPerQuery = 5,
  maxSources = 4,
}) {
  if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new Error("A research plan with tasks is required.");
  }

  if (typeof searchImpl !== "function") {
    throw new Error("A search implementation is required.");
  }

  if (typeof readImpl !== "function") {
    throw new Error("A page reader implementation is required.");
  }

  requireIntegerInRange(maxQueries, 1, 12, "maxQueries");
  requireIntegerInRange(resultsPerQuery, 1, 5, "resultsPerQuery");
  requireIntegerInRange(maxSources, 1, 10, "maxSources");

  const scheduledQueries = scheduleQueries(plan.tasks, maxQueries);
  const candidatesByUrl = new Map();
  const failures = [];

  for (const item of scheduledQueries) {
    try {
      const results = await searchImpl(item.query, {
        limit: resultsPerQuery,
      });

      for (const result of results) {
        const existing = candidatesByUrl.get(result.url);

        if (existing) {
          if (!existing.taskIds.includes(item.taskId)) {
            existing.taskIds.push(item.taskId);
          }

          if (!existing.queries.includes(item.query)) {
            existing.queries.push(item.query);
          }

          continue;
        }

        candidatesByUrl.set(result.url, {
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          taskIds: [item.taskId],
          queries: [item.query],
        });
      }
    } catch (error) {
      failures.push({
        stage: "search",
        taskId: item.taskId,
        query: item.query,
        error: error.message,
      });
    }
  }

  const sources = [];

  const orderedCandidates = orderCandidatesByTask(
    plan.tasks,
    [...candidatesByUrl.values()],
  );

  for (const candidate of orderedCandidates) {
    if (sources.length === maxSources) {
      break;
    }

    try {
      const page = await readImpl(candidate.url);

      sources.push({
        id: `S${sources.length + 1}`,
        ...page,
        snippet: candidate.snippet,
        taskIds: candidate.taskIds,
        queries: candidate.queries,
      });
    } catch (error) {
      failures.push({
        stage: "read",
        url: candidate.url,
        error: error.message,
      });
    }
  }

  return {
    scheduledQueries,
    sources,
    failures,
  };
}
