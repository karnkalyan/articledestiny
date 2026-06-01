"use client";

import React, { useEffect } from "react";
import { recordReadingHistory } from "@/actions/history";

interface TrackerArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  excerpt: string;
}

interface HistoryTrackerProps {
  article: TrackerArticle;
  isAuthenticated: boolean;
}

export function HistoryTracker({ article, isAuthenticated }: HistoryTrackerProps) {
  useEffect(() => {
    const recordLog = async () => {
      if (isAuthenticated) {
        // Authenticated Session: Save to SQLite database
        try {
          await recordReadingHistory(article.id);
        } catch (error) {
          console.error("Failed to persist database reading history:", error);
        }
      } else {
        // Anonymous Session: Save to local storage
        try {
          const historyKey = "article-destiny-history";
          const saved = localStorage.getItem(historyKey);
          let historyList = saved ? JSON.parse(saved) : [];

          // Remove potential existing records of the same article to top-weight newer read timings
          historyList = historyList.filter((item: any) => item.id !== article.id && item.slug !== article.slug);

          // Prepend newest logging item
          const recordItem = {
            id: article.id,
            slug: article.slug,
            title: article.title,
            category: article.category,
            coverImage: article.coverImage,
            excerpt: article.excerpt,
            readAt: new Date().toISOString(),
          };

          historyList.unshift(recordItem);

          // Max cap list to last 50 read logs to prevent cookies overflow
          if (historyList.length > 50) {
            historyList = historyList.slice(0, 50);
          }

          localStorage.setItem(historyKey, JSON.stringify(historyList));
        } catch (error) {
          console.error("Local storage history caching prohibited:", error);
        }
      }
    };

    recordLog();
  }, [article, isAuthenticated]);

  return null;
}
