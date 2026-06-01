const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "because",
  "been",
  "being",
  "but",
  "can",
  "for",
  "from",
  "has",
  "have",
  "how",
  "into",
  "its",
  "more",
  "not",
  "our",
  "that",
  "the",
  "their",
  "this",
  "through",
  "with",
  "you",
  "your",
]);

export interface SeoInput {
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  focusKeyword?: string;
}

export interface GeneratedSeo {
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  focusKeyword: string;
  seoScore: number;
}

export function stripHtml(value = "") {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function limitText(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 60 ? lastSpace : sliced.length).trim()}...`;
}

export function generateKeywords(input: SeoInput, maxKeywords = 12) {
  const source = stripHtml(`${input.title} ${input.category || ""} ${input.excerpt || ""} ${input.content || ""}`);
  const words = source
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{2,}/g) || [];

  const counts = new Map<string, number>();
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
    .slice(0, maxKeywords);

  if (input.category && !keywords.includes(input.category.toLowerCase())) {
    keywords.unshift(input.category.toLowerCase());
  }

  return [...new Set(keywords)].slice(0, maxKeywords).join(", ");
}

export function calculateSeoScore(seo: Omit<GeneratedSeo, "seoScore">, content = "") {
  let score = 0;
  const plain = stripHtml(content);
  const titleLength = seo.metaTitle.length;
  const descriptionLength = seo.metaDescription.length;
  const keyword = seo.focusKeyword.toLowerCase();

  if (titleLength >= 35 && titleLength <= 65) score += 20;
  if (descriptionLength >= 110 && descriptionLength <= 160) score += 25;
  if (seo.metaKeywords.split(",").filter(Boolean).length >= 5) score += 15;
  if (keyword && seo.metaTitle.toLowerCase().includes(keyword)) score += 10;
  if (keyword && seo.metaDescription.toLowerCase().includes(keyword)) score += 10;
  if (seo.ogImage || seo.twitterImage) score += 10;
  if (plain.split(/\s+/).filter(Boolean).length >= 300) score += 10;

  return Math.min(score, 100);
}

export function generateSeo(input: SeoInput): GeneratedSeo {
  const plainContent = stripHtml(input.content || "");
  const excerpt = limitText(input.excerpt || plainContent || input.title, 160);
  const keywords = input.metaKeywords?.trim() || generateKeywords({ ...input, excerpt });
  const focusKeyword = input.focusKeyword?.trim() || keywords.split(",")[0]?.trim() || input.category || input.title;
  const metaTitle = limitText(input.metaTitle || `${input.title} | ArticleDestiny`, 65);
  const metaDescription = limitText(input.metaDescription || excerpt, 160);
  const image = input.coverImage || "";

  const seoWithoutScore = {
    excerpt,
    metaTitle,
    metaDescription,
    metaKeywords: keywords,
    canonicalUrl: input.canonicalUrl?.trim() || "",
    ogTitle: limitText(input.ogTitle || metaTitle, 70),
    ogDescription: limitText(input.ogDescription || metaDescription, 200),
    ogImage: input.ogImage?.trim() || image,
    twitterTitle: limitText(input.twitterTitle || metaTitle, 70),
    twitterDescription: limitText(input.twitterDescription || metaDescription, 200),
    twitterImage: input.twitterImage?.trim() || image,
    focusKeyword: limitText(focusKeyword, 80),
  };

  return {
    ...seoWithoutScore,
    seoScore: calculateSeoScore(seoWithoutScore, input.content || ""),
  };
}
