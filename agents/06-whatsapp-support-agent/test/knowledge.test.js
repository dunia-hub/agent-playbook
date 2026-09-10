import test from "node:test";
import assert from "node:assert/strict";
import { retrieveArticles, validateKnowledgeBase } from "../src/knowledge.js";

const articles = [
  {
    id: "link-sw",
    language: "sw",
    title: "Kiungo cha warsha",
    keywords: ["kiungo", "Google Meet", "warsha"],
    answer: "Kiungo kinatumwa kwenye uthibitisho.",
  },
  {
    id: "register-sw",
    language: "sw",
    title: "Usajili",
    keywords: ["usajili", "kujisajili"],
    answer: "Jisajili kwenye ukurasa wa tukio.",
  },
  {
    id: "link-en",
    language: "en",
    title: "Workshop link",
    keywords: ["link", "Google Meet"],
    answer: "The link is in the confirmation.",
  },
];

test("knowledge: validates a multilingual knowledge base", () => {
  const result = validateKnowledgeBase({ articles });
  assert.equal(result.articles.length, 3);
});

test("knowledge: rejects empty data and duplicate IDs", () => {
  assert.throws(() => validateKnowledgeBase({ articles: [] }), /empty/);
  assert.throws(
    () => validateKnowledgeBase({ articles: [articles[0], articles[0]] }),
    /Duplicate article id/
  );
});

test("knowledge: rejects articles without keywords", () => {
  assert.throws(
    () => validateKnowledgeBase({ articles: [{ ...articles[0], keywords: [] }] }),
    /keywords/
  );
});

test("knowledge: retrieves only the detected language", () => {
  const matches = retrieveArticles({
    articles,
    language: "sw",
    text: "Kiungo cha Google Meet kiko wapi?",
    searchTerms: ["kiungo"],
  });
  assert.equal(matches[0].article.id, "link-sw");
  assert.ok(matches.every(({ article }) => article.language === "sw"));
});

test("knowledge: ranks stronger keyword matches first", () => {
  const matches = retrieveArticles({
    articles,
    language: "sw",
    text: "Nataka kiungo cha Google Meet kwa warsha",
    searchTerms: ["warsha"],
  });
  assert.equal(matches[0].article.id, "link-sw");
  assert.ok(matches[0].score > matches[1]?.score || matches.length === 1);
});

test("knowledge: returns no guess when nothing matches", () => {
  assert.deepEqual(
    retrieveArticles({
      articles,
      language: "sw",
      text: "Nina swali tofauti",
      searchTerms: ["tofauti"],
    }),
    []
  );
});

test("knowledge: handles accented text", () => {
  const french = [{
    id: "presence-fr",
    language: "fr",
    title: "Présence",
    keywords: ["présence"],
    answer: "Vérifiez la page.",
  }];
  const matches = retrieveArticles({
    articles: french,
    language: "fr",
    text: "Comment confirmer ma présence?",
    searchTerms: [],
  });
  assert.equal(matches[0].article.id, "presence-fr");
});
