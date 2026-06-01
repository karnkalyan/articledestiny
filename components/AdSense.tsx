import React from "react";
import { getLiveAdByPlacement } from "@/actions/admin";

interface AdSenseProps {
  placement: "top" | "sidebar" | "bottom";
}

export async function AdSense({ placement }: AdSenseProps) {
  try {
    const ad = await getLiveAdByPlacement(placement);
    if (!ad || !ad.active || !ad.code) return null;

    return (
      <div
        id={`ad-slot-${placement}`}
        className="w-full my-6 select-none overflow-hidden rounded-xl border border-gray-100 dark:border-zinc-850"
        dangerouslySetInnerHTML={{ __html: ad.code }}
      />
    );
  } catch (error) {
    // Graceful fail in case of errors, keeping UI running
    return null;
  }
}
