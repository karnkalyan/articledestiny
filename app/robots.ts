import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site_url: siteUrl } = await getPublicSiteSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/login", "/register"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
