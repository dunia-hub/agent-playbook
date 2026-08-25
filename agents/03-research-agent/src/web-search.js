import * as cheerio from "cheerio";

const SEARCH_URL = "https://html.duckduckgo.com/html/";

function validateLimit(limit) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error("Search result limit must be an integer from 1 to 10.");
  }

  return limit;
}

function resolveResultUrl(href) {
  if (typeof href !== "string" || href.trim() === "") {
    return null;
  }

  try {
    const url = new URL(href, "https://duckduckgo.com");

    if (url.hostname.endsWith("duckduckgo.com")) {
      const destination = url.searchParams.get("uddg");

      if (destination) {
        return new URL(destination).href;
      }
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseSearchResults(html, query, limit = 5) {
  if (typeof html !== "string") {
    throw new TypeError("Search response must be HTML text.");
  }

  if (typeof query !== "string" || query.trim() === "") {
    throw new Error("Search query must be a non-empty string.");
  }

  validateLimit(limit);

  const $ = cheerio.load(html);
  const results = [];
  const seenUrls = new Set();

  $(".result").each((_, element) => {
    if (results.length >= limit) {
      return;
    }

    const link = $(element).find(".result__a").first();
    const title = link.text().replace(/\s+/g, " ").trim();
    const url = resolveResultUrl(link.attr("href"));
    const snippet = $(element)
      .find(".result__snippet")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!title || !url || seenUrls.has(url)) {
      return;
    }

    seenUrls.add(url);
    results.push({
      title,
      url,
      snippet,
      query: query.trim(),
    });
  });

  return results;
}

export async function searchWeb(
  query,
  {
    limit = 5,
    fetchImpl = globalThis.fetch,
    timeoutMs = 10000,
  } = {},
) {
  if (typeof query !== "string" || query.trim() === "") {
    throw new Error("Search query must be a non-empty string.");
  }

  validateLimit(limit);

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error("Search timeout must be a positive integer.");
  }

  const url = `${SEARCH_URL}?q=${encodeURIComponent(query.trim())}`;

  const response = await fetchImpl(url, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (compatible; DuniaHubResearchAgent/1.0)",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Search request failed with status ${response.status}.`,
    );
  }

  const html = await response.text();
  return parseSearchResults(html, query, limit);
}
