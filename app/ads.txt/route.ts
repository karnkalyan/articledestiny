import { getAdsTxtLine } from "@/lib/google-verification";
import { getPublicSiteSettings } from "@/lib/site";

// Hardcoded fallback so ads.txt always works even if DB fetch fails
const FALLBACK_ADS_TXT = "google.com, pub-8012743747071481, DIRECT, f08c47fec0942fa0";

export async function GET() {
  let adsTxtLine = FALLBACK_ADS_TXT;

  try {
    const settings = await getPublicSiteSettings();
    const dynamicLine = getAdsTxtLine(settings.adsense_client_id);
    if (dynamicLine) {
      adsTxtLine = dynamicLine;
    }
  } catch (e) {
    // Use fallback
  }

  return new Response(`${adsTxtLine}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
