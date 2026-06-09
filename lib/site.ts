import { db } from "@/lib/db";
import {
  normalizeAdSenseClientId,
  normalizeGa4MeasurementId,
  normalizeSearchConsoleToken,
} from "@/lib/google-verification";

export type PublicSiteSettings = {
  site_url: string;
  google_search_console_verification: string;
  ga4_measurement_id: string;
  adsense_client_id: string;
  adsense_auto_ads: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_og_image: string;
  site_twitter_handle: string;
};

const PUBLIC_KEYS = [
  "site_url",
  "google_search_console_verification",
  "ga4_measurement_id",
  "adsense_client_id",
  "adsense_auto_ads",
  "site_title",
  "site_description",
  "site_keywords",
  "site_og_image",
  "site_twitter_handle",
];

const DEFAULT_PUBLIC_SITE_URL = "https://articledestiny.com";

function normalizePublicSiteUrl(value?: string) {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || value || DEFAULT_PUBLIC_SITE_URL).trim().replace(/\/+$/, "");
  if (!raw || raw.includes("localhost") || raw.includes("127.0.0.1")) {
    return DEFAULT_PUBLIC_SITE_URL;
  }
  return raw;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: PUBLIC_KEYS } },
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const siteUrl = normalizePublicSiteUrl(settings.site_url);

  return {
    site_url: siteUrl,
    google_search_console_verification: normalizeSearchConsoleToken(settings.google_search_console_verification || ""),
    ga4_measurement_id: normalizeGa4MeasurementId(settings.ga4_measurement_id || ""),
    adsense_client_id: normalizeAdSenseClientId(settings.adsense_client_id || ""),
    adsense_auto_ads: settings.adsense_auto_ads || "true",
    site_title: settings.site_title || "",
    site_description: settings.site_description || "",
    site_keywords: settings.site_keywords || "",
    site_og_image: settings.site_og_image || "",
    site_twitter_handle: settings.site_twitter_handle || "",
  };
}

export function getFallbackPublicSiteUrl() {
  return normalizePublicSiteUrl();
}
