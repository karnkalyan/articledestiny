import type { MetadataRoute } from "next";
import { getFallbackPublicSiteUrl, getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  let siteUrl = getFallbackPublicSiteUrl();

  try {
    const settings = await getPublicSiteSettings();
    siteUrl = settings.site_url || siteUrl;
  } catch (error) {
    console.error("Unable to load site settings for robots.txt:", error);
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/api/profile", "/api/articles", "/api/media/upload", "/login", "/register"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
