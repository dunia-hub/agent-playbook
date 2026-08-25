import test from "node:test";
import assert from "node:assert/strict";

import {
  extractPageContent,
  readPage,
  validatePublicUrl,
} from "../src/page-reader.js";

const articleText =
  "Research agents gather evidence from multiple sources before producing an answer. " +
  "Reliable workflows preserve the connection between each important claim and the source that supports it. " +
  "Researchers should also compare publication dates, methods, limitations, and conflicting findings.";

const sampleHtml = `
<!doctype html>
<html>
  <head>
    <title>Fallback title</title>
    <meta property="og:title" content="Source Verification Study">
    <meta
      name="description"
      content="A study of source-grounded research workflows."
    >
    <meta
      property="article:published_time"
      content="2026-07-10"
    >
    <script>const misleadingText = "Do not extract this";</script>
  </head>
  <body>
    <nav>Navigation should be removed.</nav>
    <main>
      <p>This main text should not be selected when an article exists.</p>
    </main>
    <article>
      <h1>Source Verification Study</h1>
      <p>${articleText}</p>
    </article>
    <footer>Footer text should be removed.</footer>
  </body>
</html>
`;

test("accepts a public HTTP or HTTPS URL", () => {
  assert.equal(
    validatePublicUrl("https://example.com/report").href,
    "https://example.com/report",
  );
});

test("rejects unsupported URL protocols", () => {
  assert.throws(
    () => validatePublicUrl("file:///etc/passwd"),
    /must use HTTP or HTTPS/,
  );
});

test("rejects localhost and private IPv4 addresses", () => {
  assert.throws(
    () => validatePublicUrl("http://localhost/report"),
    /private address/,
  );

  assert.throws(
    () => validatePublicUrl("http://192.168.1.5/report"),
    /private address/,
  );
});

test("extracts metadata and article content", () => {
  const page = extractPageContent(
    sampleHtml,
    "https://example.com/report",
  );

  assert.equal(page.title, "Source Verification Study");
  assert.equal(page.domain, "example.com");
  assert.equal(page.publishedAt, "2026-07-10");
  assert.equal(
    page.description,
    "A study of source-grounded research workflows.",
  );
  assert.match(page.content, /Research agents gather evidence/);
  assert.doesNotMatch(page.content, /Navigation should be removed/);
  assert.doesNotMatch(page.content, /Do not extract this/);
});

test("rejects pages with too little readable content", () => {
  assert.throws(
    () =>
      extractPageContent(
        "<html><body><p>Too short.</p></body></html>",
        "https://example.com",
      ),
    /did not contain enough readable content/,
  );
});

test("readPage fetches and extracts an HTML source", async () => {
  const calls = [];

  async function fakeFetch(url, options) {
    calls.push({ url, options });

    return {
      ok: true,
      status: 200,
      url: "https://example.com/report",
      headers: {
        get(name) {
          return name === "content-type"
            ? "text/html; charset=utf-8"
            : null;
        },
      },
      async text() {
        return sampleHtml;
      },
    };
  }

  const page = await readPage("https://example.com/report", {
    fetchImpl: fakeFetch,
    timeoutMs: 5000,
  });

  assert.equal(page.title, "Source Verification Study");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.redirect, "follow");
});

test("rejects unsuccessful source responses", async () => {
  async function fakeFetch() {
    return {
      ok: false,
      status: 403,
      headers: {
        get() {
          return "text/html";
        },
      },
    };
  }

  await assert.rejects(
    () =>
      readPage("https://example.com/report", {
        fetchImpl: fakeFetch,
      }),
    /status 403/,
  );
});

test("rejects unsupported source content types", async () => {
  async function fakeFetch() {
    return {
      ok: true,
      status: 200,
      headers: {
        get() {
          return "application/pdf";
        },
      },
    };
  }

  await assert.rejects(
    () =>
      readPage("https://example.com/report.pdf", {
        fetchImpl: fakeFetch,
      }),
    /Unsupported source content type/,
  );
});
