"use client";

import React, { useEffect, useRef } from "react";

interface AutoAdSlotProps {
  format?: "auto" | "in-article" | "in-feed" | "display" | "multiplex";
  className?: string;
  slot?: string;
}

/**
 * Client component that renders a Google AdSense ad unit.
 * Uses the global adsbygoogle loaded by layout.tsx.
 * Format options:
 *  - "auto" — responsive auto ads
 *  - "in-article" — native in-article ads
 *  - "in-feed" — native in-feed ads
 *  - "display" — standard display ads
 *  - "multiplex" — multiplex ads (grid)
 */
export function AutoAdSlot({
  format = "auto",
  className = "",
  slot,
}: AutoAdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle && adRef.current) {
        adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense may not be loaded yet or blocked
    }
  }, []);

  const layoutKey = format === "in-feed" ? "-fb+5w+4e-db+86" : undefined;

  return (
    <div
      className={`w-full my-6 min-h-[90px] select-none overflow-hidden rounded-xl ${className}`}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format={format === "in-feed" ? "fluid" : format === "in-article" ? "fluid" : format}
        data-ad-layout-key={layoutKey}
        data-ad-client="ca-pub-8012743747071481"
        data-ad-slot={slot || ""}
        data-full-width-responsive="true"
      />
    </div>
  );
}
