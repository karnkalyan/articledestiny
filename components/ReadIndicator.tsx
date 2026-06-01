"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ReadIndicatorProps {
  articleId: number;
  articleSlug: string;
  dbReadIds?: number[]; // Pre-fetched array of IDs the authenticated user has read
}

export function ReadIndicator({ articleId, articleSlug, dbReadIds = [] }: ReadIndicatorProps) {
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    // Check authenticated database array
    if (dbReadIds.includes(articleId)) {
      setIsRead(true);
      return;
    }

    // Check anonymous local storage array
    try {
      const saved = localStorage.getItem("article-destiny-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = parsed.some((item: any) => item.id === articleId || item.slug === articleSlug);
        setIsRead(match);
      }
    } catch (error) {
      // Gracefully bypass error in sandboxed/restricted browser configurations
    }
  }, [articleId, articleSlug, dbReadIds]);

  if (!isRead) return null;

  return (
    <span
      id={`read-badge-${articleId}`}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-150 text-[10px] text-teal-600 font-extrabold font-mono uppercase tracking-wider dark:bg-teal-950/20 dark:border-teal-900/60 dark:text-teal-400 select-none animate-fade-in"
      title="You have previously read this article"
    >
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      <span>Read</span>
    </span>
  );
}
