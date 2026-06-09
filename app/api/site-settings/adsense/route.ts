import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/site";

const FALLBACK_ADSENSE_CLIENT = "ca-pub-8012743747071481";

export async function GET() {
  try {
    const settings = await getPublicSiteSettings();
    return NextResponse.json({
      clientId: settings.adsense_client_id || FALLBACK_ADSENSE_CLIENT,
    });
  } catch (_) {
    return NextResponse.json({ clientId: FALLBACK_ADSENSE_CLIENT });
  }
}
