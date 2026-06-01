"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Clock, Trash2, ShieldAlert, BookOpen, Sparkles } from "lucide-react";
import { getReadingHistory, clearReadingHistory } from "@/actions/history";
import { getMe } from "@/actions/auth";
import { SafeUser } from "@/types";

interface SimpleHistoryItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  excerpt: string;
  readAt: string;
}

export default function HistoryPage() {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [localHistory, setLocalHistory] = useState<SimpleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const user = await getMe();
        setCurrentUser(user);

        if (user) {
          // If logged in, fetch database history
          const dbData = await getReadingHistory();
          setDbHistory(dbData);
        } else {
          // If anonymous, fetch localStorage
          const saved = localStorage.getItem("article-destiny-history");
          if (saved) {
            setLocalHistory(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error("Error bootstrapping history page:", err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to completely clear your reading history? This action cannot be undone.")) {
      setLoading(true);
      if (currentUser) {
        await clearReadingHistory();
        setDbHistory([]);
      } else {
        localStorage.removeItem("article-destiny-history");
        setLocalHistory([]);
      }
      setLoading(false);
    }
  };

  const hasHistory = currentUser ? dbHistory.length > 0 : localHistory.length > 0;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-850 pb-6 mb-8">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider uppercase">Personal Logs</span>
          <h1 className="text-2xl font-black text-slate-1000 dark:text-zinc-100 tracking-tight mt-1">
            Your Reading History
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser
              ? `Displaying database-backed logs for ${currentUser.name}`
              : "Displaying localized browser cookie-cache logs"}
          </p>
        </div>

        {hasHistory && (
          <button
            onClick={handleClearHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-400 rounded-xl transition-all cursor-pointer self-start md:self-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Prompts for Anonymous Users */}
      {!currentUser && (
        <div className="mb-8 p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-805 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
            <p className="font-medium">
              You are viewing history on this browser only. <strong>Sign In</strong> to securely save your logs.
            </p>
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center whitespace-nowrap self-start sm:self-center"
          >
            Sign In Now
          </Link>
        </div>
      )}

      {/* History Items rendering block */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650 mx-auto" />
          <p className="text-xs text-gray-400 mt-3 font-mono">Loading records...</p>
        </div>
      ) : !hasHistory ? (
        <div className="py-16 text-center max-w-sm mx-auto">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-zinc-800 mx-auto stroke-1 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-wider font-mono mt-4">Safe & Sound</h3>
          <p className="text-xs text-gray-450 mt-1.5 leading-relaxed">
            Your reading history is clean! Once you explorer and inspect our curated articles, they will appear right here.
          </p>
          <Link
            href="/"
            className="inline-block mt-5 px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wide"
          >
            Discover Articles
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentUser
            ? dbHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col sm:flex-row gap-4 p-4.5 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl hover:border-gray-200 dark:hover:border-zinc-800 transition-all shadow-sm"
                >
                  <img
                    src={item.article.coverImage}
                    alt={item.article.title}
                    className="w-full sm:w-32 h-20 object-cover rounded-xl shrink-0 bg-gray-50 border border-gray-100 dark:border-zinc-900"
                  />
                  <div className="flex-grow flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest font-mono">
                        {item.article.category}
                      </span>
                      <span className="text-gray-300 select-none">•</span>
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(item.readAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-1000 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      <Link href={`/blog/${item.article.slug}`}>{item.article.title}</Link>
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.article.excerpt}
                    </p>
                  </div>
                </div>
              ))
            : localHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col sm:flex-row gap-4 p-4.5 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl hover:border-gray-200 dark:hover:border-zinc-800 transition-all shadow-sm"
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full sm:w-32 h-20 object-cover rounded-xl shrink-0 bg-gray-50 border border-gray-100 dark:border-zinc-900"
                  />
                  <div className="flex-grow flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest font-mono">
                        {item.category}
                      </span>
                      <span className="text-gray-300 select-none">•</span>
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(item.readAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-1000 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
