import React from "react";
import { getLiveAdByPlacement } from "@/actions/admin";
import { AutoAdSlot } from "@/components/AutoAdSlot";
import { getPublicSiteSettings } from "@/lib/site";

interface AdSenseProps {
  placement: "top" | "sidebar" | "bottom";
}

export async function AdSense({ placement }: AdSenseProps) {
  try {
    const siteSettings = await getPublicSiteSettings();
    const adsenseClientId = siteSettings.adsense_client_id || "ca-pub-8012743747071481";
    const ad = await getLiveAdByPlacement(placement);
    const hasPlaceholderCode = ad?.code?.includes("Sponsored Advertisement");
    if (!ad || !ad.active || !ad.code || hasPlaceholderCode) {
      const fallbackFormat = placement === "bottom" ? "multiplex" : "auto";
      return <AutoAdSlot format={fallbackFormat} clientId={adsenseClientId} className={placement === "sidebar" ? "sticky top-24" : ""} />;
    }

    return (
      <div
        id={`ad-slot-${placement}`}
        className="w-full my-6 select-none overflow-hidden rounded-xl border border-gray-100 dark:border-zinc-850"
        dangerouslySetInnerHTML={{ __html: ad.code }}
      />
    );
  } catch (error) {
    const fallbackFormat = placement === "bottom" ? "multiplex" : "auto";
    return <AutoAdSlot format={fallbackFormat} className={placement === "sidebar" ? "sticky top-24" : ""} />;
  }
}
