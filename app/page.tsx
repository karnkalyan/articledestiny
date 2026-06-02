import React from "react";
import Link from "next/link";
import { Compass, Sparkles, BookOpen, Clock, ArrowRight, BookMarked } from "lucide-react";
import { db } from "@/lib/db";
import { getArticles, getCategories } from "@/actions/blog";
import { getMe } from "@/actions/auth";
import { AdSense } from "@/components/AdSense";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ReadIndicator } from "@/components/ReadIndicator";

interface SearchParamsResponse {
  category?: string;
}

export default async function HomePage(props: {
  searchParams: Promise<SearchParamsResponse>;
}) {
  const searchParams = await props.searchParams;
  const activeCategory = searchParams.category || "All";

  // 1. Core user session
  const currentUser = await getMe();

  // Load site settings for About Spotlight
  const aboutRows = await db.siteSetting.findMany({
    where: { key: { in: ["about_title", "about_intro"] } },
  });
  const aboutSettings = Object.fromEntries(aboutRows.map((r) => [r.key, r.value]));
  const aboutTitle = aboutSettings.about_title || "ArticleDestiny Editorial";
  const aboutIntro = aboutSettings.about_intro || "A boutique publishing ecosystem exploring micro-frontends, Rust servers, minimalism design architecture, and human productivity loops.";

  // 3. Fetch categories & filtered articles
  const categoriesList = await getCategories();
  const allArticles = await getArticles(activeCategory);

  // 4. Fetch authenticated user's read history IDs for read-badges
  const dbReadIds: number[] = [];
  if (currentUser) {
    try {
      const histories = await db.readingHistory.findMany({
        where: { userId: currentUser.id },
        select: { articleId: true },
      });
      histories.forEach((h) => dbReadIds.push(h.articleId));
    } catch (_) {}
  }

  // Spotlight Article: First published article
  const spotlight = allArticles.length > 0 ? allArticles[0] : null;
  const secondaryArticles = allArticles.length > 1 ? allArticles.slice(1) : [];

  return (
    <div className="space-y-12">
      {/* Dynamic Top Ad Placement */}
      <AdSense placement="top" />

      {/* Hero Spotlight Header Card (Only display if active filter is "All" and there is a spotlight) */}
      {activeCategory === "All" && spotlight && (
        <div id="hero-spotlight" className="group relative bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Cover */}
            <div className="lg:col-span-7 h-64 sm:h-96 relative overflow-hidden">
              <img
                src={spotlight.coverImage}
                alt={spotlight.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 bg-gray-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
            </div>

            {/* Editorial Copy */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono">
                    {spotlight.category}
                  </span>
                  <ReadIndicator
                    articleId={spotlight.id}
                    articleSlug={spotlight.slug}
                    dbReadIds={dbReadIds}
                  />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-1000 dark:text-zinc-50 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors tracking-tight leading-tight">
                  <Link href={`/blog/${spotlight.slug}`}>{spotlight.title}</Link>
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-normal line-clamp-3">
                  {spotlight.excerpt}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-100 hover:scale-105 transition-transform flex items-center justify-center font-bold text-[9px] uppercase dark:bg-zinc-90 w-fit">
                    {spotlight.author.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-350">{spotlight.author.name}</span>
                </div>

                <Link
                  href={`/blog/${spotlight.slug}`}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-650 hover:text-indigo-750 transition-colors group-hover:translate-x-1"
                >
                  <span>Explore Entry</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Catalog & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Catalog Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-900 pb-5">
            <h3 className="text-sm font-bold text-slate-1000 dark:text-zinc-150 uppercase tracking-widest font-mono">
              Curated Catalog ({allArticles.length})
            </h3>

            {/* Scrolling Navigation List */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categoriesList.map((cat) => (
                <Link
                  key={cat}
                  href={cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`}
                  className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded-lg border transition-all ${
                    (cat === activeCategory || (cat === "All" && activeCategory === "All"))
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-zinc-805 dark:hover:bg-zinc-900"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Articles Catalog Cards */}
          {allArticles.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900">
              <BookOpen className="h-10 w-10 text-gray-350 dark:text-zinc-800 mx-auto stroke-1 mb-3" />
              <p className="text-xs text-gray-550 dark:text-zinc-500 italic">
                No matching articles published inside {activeCategory} category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {allArticles.map((art) => (
                <div
                  key={art.id}
                  className="group bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover graphic */}
                    <div className="h-44 relative overflow-hidden bg-gray-50 border-b border-gray-50 dark:border-zinc-900">
                      <img
                        src={art.coverImage}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-2.5 py-0.5 rounded-md text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono border border-gray-100/50 dark:border-zinc-800 shadow-sm">
                        {art.category}
                      </div>

                      <div className="absolute top-3 right-3">
                        <ReadIndicator
                          articleId={art.id}
                          articleSlug={art.slug}
                          dbReadIds={dbReadIds}
                        />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-5.5 space-y-2.5">
                      <h3 className="text-base font-bold text-slate-1000 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight tracking-tight">
                        <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-normal line-clamp-4">
                        {art.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Footing actions */}
                  <div className="px-5.5 pb-5.5 pt-3.5 border-t border-gray-50 dark:border-zinc-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(art.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${art.slug}`}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      <span>Read Entry</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Editorial Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Section 1: Publisher Profile */}
          <div className="p-6 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl shadow-sm text-center">
            <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono mb-2">Publisher Spotlight</h4>
            <div className="h-14 w-14 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center font-bold mx-auto text-sm shadow-md animate-pulse">
              AD
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-150 tracking-tight mt-3">{aboutTitle}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-405 leading-relaxed mt-2 font-normal">
              {aboutIntro}
            </p>
          </div>

          {/* Section 2: Ad Slot */}
          <AdSense placement="sidebar" />

          {/* Section 3: Newsletter Form Drawer */}
          <div className="p-6 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-widest font-mono border-b border-gray-100 dark:border-zinc-900 pb-3 mb-4">
              Weekly Digest
            </h4>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom Ad space */}
      <AdSense placement="bottom" />
    </div>
  );
}
