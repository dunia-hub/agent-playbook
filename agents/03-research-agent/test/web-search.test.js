import test from "node:test";
import assert from "node:assert/strict";

import {
  parseSearchResults,
  searchWeb,
} from "../src/web-search.js";

const sampleHtml = `
<!doctype html>
<html>
  <body>
    <div class="result">
      <a
        class="result__a"
        href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fresearch-report"
      >
        Example Research Report
      </a>
      <div class="result__snippet">
        A detailed report about verification methods.
      </div>
    </div>

    <div class="result">
      <a
        class="result__a"
        href="https://docs.example.org/verification"
      >
        Verification Documentation
      </a>
      <div class="result__snippet">
        Official documentation for checking claims.
      </div>
    </div>

    <div class="result">
      <a
        class="result__a"
        href="https://docs.example.org/verification"
      >
        Duplicate Documentation Result
      </a>
      <div class="result__snippet">
        This URL should not appear twice.
      </div>
    </div>

    <div class="result">
      <a class="result__a" href="">
        Missing URL
      </a>
    </div>
  </body>
</html>
`;

test("extracts structured search results from HTML", () => {
  const results = parseSearchResults(
    sampleHtml,
    "research verification",
    5,
  );

  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    title: "Example Research Report",
    url: "https://example.com/research-report",
    snippet: "A detailed report about verification methods.",
    query: "research verification",
  });
});

test("accepts direct result URLs", () => {
  const results = parseSearchResults(
    sampleHtml,
    "research verification",
    5,
  );

  assert.equal(
    results[1].url,
    "https://docs.example.org/verification",
  );
});

test("removes duplicate result URLs", () => {
  const results = parseSearchResults(
    sampleHtml,
    "research verification",
    5,
  );

  assert.equal(results.length, 2);
});

test("respects the requested result limit", () => {
  const results = parseSearchResults(
    sampleHtml,
    "research verification",
    1,
  );

  assert.equal(results.length, 1);
});

test("rejects an invalid result limit", () => {
  assert.throws(
    () => parseSearchResults(sampleHtml, "research", 11),
    /integer from 1 to 10/,
  );
});

test("searchWeb sends the encoded query and parses the response", async () => {
  const calls = [];

  async function fakeFetch(url, options) {
    calls.push({ url, options });

    return {
      ok: true,
      status: 200,
      async text() {
        return sampleHtml;
      },
    };
  }

  const results = await searchWeb("claim verification", {
    limit: 2,
    fetchImpl: fakeFetch,
    timeoutMs: 5000,
  });

  assert.equal(results.length, 2);
  assert.match(calls[0].url, /q=claim%20verification/);
  assert.equal(
    calls[0].options.headers.Accept,
    "text/html",
  );
});

test("reports unsuccessful search responses", async () => {
  async function fakeFetch() {
    return {
      ok: false,
      status: 503,
    };
  }

  await assert.rejects(
    () =>
      searchWeb("claim verification", {
        fetchImpl: fakeFetch,
      }),
    /status 503/,
  );
});
