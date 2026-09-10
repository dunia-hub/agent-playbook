function normalize(text) {
  return String(text)
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateKnowledgeBase(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.articles)) {
    throw new Error("Knowledge base must contain an articles array.");
  }
  if (data.articles.length === 0) throw new Error("Knowledge base is empty.");
  const ids = new Set();
  const articles = data.articles.map((article, index) => {
    const label = `articles[${index}]`;
    if (!article || typeof article !== "object") throw new Error(`${label} must be an object.`);
    for (const field of ["id", "language", "title", "answer"]) {
      if (typeof article[field] !== "string" || !article[field].trim()) {
        throw new Error(`${label}.${field} is required.`);
      }
    }
    if (!/^[a-z]{2,3}$/.test(article.language)) {
      throw new Error(`${label}.language must be a lowercase ISO language code.`);
    }
    if (!Array.isArray(article.keywords) || article.keywords.length === 0) {
      throw new Error(`${label}.keywords must contain at least one item.`);
    }
    if (article.keywords.some((keyword) => typeof keyword !== "string" || !keyword.trim())) {
      throw new Error(`${label}.keywords contains an invalid value.`);
    }
    if (ids.has(article.id)) throw new Error(`Duplicate article id: ${article.id}.`);
    ids.add(article.id);
    return {
      ...article,
      id: article.id.trim(),
      title: article.title.trim(),
      answer: article.answer.trim(),
      keywords: article.keywords.map((keyword) => keyword.trim()),
    };
  });
  return { articles };
}

export function retrieveArticles({ articles, language, text, searchTerms, limit = 3 }) {
  const query = normalize([text, ...searchTerms].join(" "));
  return articles
    .filter((article) => article.language === language)
    .map((article) => {
      let score = 0;
      for (const keyword of article.keywords) {
        const normalizedKeyword = normalize(keyword);
        if (normalizedKeyword && query.includes(normalizedKeyword)) {
          score += normalizedKeyword.includes(" ") ? 3 : 2;
        }
      }
      for (const term of searchTerms) {
        const normalizedTerm = normalize(term);
        if (normalizedTerm && normalize(`${article.title} ${article.answer}`).includes(normalizedTerm)) {
          score += 1;
        }
      }
      return { article, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id))
    .slice(0, limit);
}
