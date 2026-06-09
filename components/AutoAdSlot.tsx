"use client";

import React, { useEffect, useRef, useState } from "react";

interface AutoAdSlotProps {
  format?: "auto" | "in-article" | "in-feed" | "display" | "multiplex";
  className?: string;
  slot?: string;
  clientId?: string;
}

const FALLBACK_ADSENSE_CLIENT = "ca-pub-8012743747071481";

const AD_UNITS = {
  auto: {
    slot: "2163554512",
    format: "auto",
    fullWidthResponsive: "true",
  },
  display: {
    slot: "2163554512",
    format: "auto",
    fullWidthResponsive: "true",
  },
  "in-feed": {
    slot: "5301729457",
    format: "fluid",
    layoutKey: "-ef+6k-30-ac+ty",
  },
  "in-article": {
    slot: "2675566110",
    format: "fluid",
    layout: "in-article",
  },
  multiplex: {
    slot: "9049402772",
    format: "autorelaxed",
  },
} as const;

export function AutoAdSlot({
  format = "auto",
  className = "",
  slot,
  clientId,
}: AutoAdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [resolvedClientId, setResolvedClientId] = useState(clientId || "");
  const unit = AD_UNITS[format];
  const layout = "layout" in unit ? unit.layout : undefined;
  const layoutKey = "layoutKey" in unit ? unit.layoutKey : undefined;
  const fullWidthResponsive = "fullWidthResponsive" in unit ? unit.fullWidthResponsive : undefined;

  useEffect(() => {
    let alive = true;

    async function resolveClientId() {
      try {
        if (clientId) {
          setResolvedClientId(clientId);
          return;
        }
        const response = await fetch("/api/site-settings/adsense", { cache: "no-store" });
        const result = await response.json();
        if (alive) setResolvedClientId(result.clientId || FALLBACK_ADSENSE_CLIENT);
      } catch (_) {
        if (alive) setResolvedClientId(FALLBACK_ADSENSE_CLIENT);
      }
    }

    resolveClientId();
    return () => {
      alive = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (pushed.current || !resolvedClientId) return;
    try {
      if (adRef.current) {
        const adsbygoogle = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
        adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (_) {
      // Ad blockers or delayed script loading can prevent push. Keep layout stable.
    }
  }, [resolvedClientId]);

  return (
    <div className={`w-full my-6 min-h-[90px] select-none overflow-hidden rounded-xl ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: format === "in-article" ? "center" : undefined }}
        data-ad-client={resolvedClientId || FALLBACK_ADSENSE_CLIENT}
        data-ad-slot={slot || unit.slot}
        data-ad-format={unit.format}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}
