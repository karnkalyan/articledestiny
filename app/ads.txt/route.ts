import { getAdsTxtLine } from "@/lib/google-verification";
import { getPublicSiteSettings } from "@/lib/site";

export async function GET() {
  const settings = await getPublicSiteSettings();
  const adsTxtLine = getAdsTxtLine(settings.adsense_client_id);

  return new Response(adsTxtLine ? `${adsTxtLine}\n` : "", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
