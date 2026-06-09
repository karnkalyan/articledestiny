import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getFallbackPublicSiteUrl, getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function urlFor(siteUrl: string, path = "") {
  return `${siteUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let siteUrl = getFallbackPublicSiteUrl();
  let articles: Array<{ slug: string; updatedAt: Date; createdAt: Date; authorId: number }> = [];
  let authorIds: Array<{ authorId: number }> = [];

  try {
    const settings = await getPublicSiteSettings();
    siteUrl = settings.site_url || siteUrl;
  } catch (error) {
    console.error("Unable to load site settings for sitemap:", error);
  }

  try {
    articles = await db.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, createdAt: true, authorId: true },
      orderBy: { updatedAt: "desc" },
    });

    authorIds = await db.article.findMany({
      where: { published: true },
      select: { authorId: true },
      distinct: ["authorId"],
    });
  } catch (error) {
    console.error("Unable to load dynamic sitemap entries:", error);
  }

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: urlFor(siteUrl),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: urlFor(siteUrl, "/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: urlFor(siteUrl, "/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: urlFor(siteUrl, `/blog/${encodeURIComponent(article.slug)}`),
    lastModified: article.updatedAt || article.createdAt,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const authorEntries: MetadataRoute.Sitemap = authorIds.map((author) => ({
    url: urlFor(siteUrl, `/author/${author.authorId}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...articleEntries, ...authorEntries];
}
