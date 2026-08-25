import * as cheerio from "cheerio";

const DEFAULT_MAX_CHARACTERS = 8000;

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

export function validatePublicUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Source URL is invalid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Source URL must use HTTP or HTTPS.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    isPrivateIpv4(hostname)
  ) {
    throw new Error("Source URL must not point to a private address.");
  }

  return url;
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function extractPageContent(
  html,
  url,
  maxCharacters = DEFAULT_MAX_CHARACTERS,
) {
  if (typeof html !== "string") {
    throw new TypeError("Page response must be HTML text.");
  }

  const parsedUrl = validatePublicUrl(url);

  if (!Number.isInteger(maxCharacters) || maxCharacters < 500) {
    throw new Error("Maximum page length must be at least 500 characters.");
  }

  const $ = cheerio.load(html);

  $("script, style, noscript, nav, footer, form, svg").remove();

  const title = cleanText(
    $('meta[property="og:title"]').attr("content") ||
      $("title").first().text() ||
      $("h1").first().text() ||
      parsedUrl.hostname,
  );

  const description = cleanText(
    $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "",
  );

  const publishedAt =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    null;

  const mainContent = $("article").first().length
    ? $("article").first()
    : $("main").first().length
      ? $("main").first()
      : $("body").first();

  const content = cleanText(mainContent.text()).slice(0, maxCharacters);

  if (content.length < 100) {
    throw new Error("Source page did not contain enough readable content.");
  }

  return {
    title,
    url: parsedUrl.href,
    domain: parsedUrl.hostname,
    description,
    publishedAt,
    content,
  };
}

export async function readPage(
  url,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = 10000,
    maxCharacters = DEFAULT_MAX_CHARACTERS,
  } = {},
) {
  const parsedUrl = validatePublicUrl(url);

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error("Page timeout must be a positive integer.");
  }

  const response = await fetchImpl(parsedUrl.href, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; DuniaHubResearchAgent/1.0)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Source request failed with status ${response.status}.`,
    );
  }

  const contentType = response.headers?.get?.("content-type") || "";

  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  ) {
    throw new Error(`Unsupported source content type: ${contentType}`);
  }

  const finalUrl = response.url || parsedUrl.href;
  validatePublicUrl(finalUrl);

  const html = await response.text();
  return extractPageContent(html, finalUrl, maxCharacters);
}
