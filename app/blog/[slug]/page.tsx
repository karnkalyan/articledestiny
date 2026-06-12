export const revalidate = 0;

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Sparkles, BookOpen } from "lucide-react";
import { getArticleBySlug, getCommentsByArticle, incrementViews } from "@/actions/blog";
import { getMe } from "@/actions/auth";
import { renderArticleContent } from "@/lib/markdown";
import { stripHtml } from "@/lib/seo";
import { getPublicSiteSettings } from "@/lib/site";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { LikeButton } from "@/components/LikeButton";
import { ShareButton } from "@/components/ShareButton";
import { CommentSection } from "@/components/CommentSection";
import { HistoryTracker } from "@/components/HistoryTracker";
import { AdSense } from "@/components/AdSense";
import { AutoAdSlot } from "@/components/AutoAdSlot";
import { AuthorHoverCard } from "@/components/AuthorHoverCard";
import { CommentWithUser } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: "Article Not Found | ArticleDestiny",
      description: "This ArticleDestiny publication could not be found.",
    };
  }

  const title = article.metaTitle || `${article.title} | ArticleDestiny`;
  const description = article.metaDescription || article.excerpt;
  const keywords = article.metaKeywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  const image = article.ogImage || article.twitterImage || article.coverImage;
  const { site_url: siteUrl } = await getPublicSiteSettings();
  const canonical = article.canonicalUrl || `${siteUrl}/blog/${article.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    authors: [{ name: article.author.name }],
    category: article.category,
    openGraph: {
      type: "article",
      title: article.ogTitle || title,
      description: article.ogDescription || description,
      images: image ? [{ url: image, alt: article.title }] : undefined,
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.author.name],
      section: article.category,
      tags: keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: article.twitterTitle || article.ogTitle || title,
      description: article.twitterDescription || article.ogDescription || description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage(props: PageProps) {
  const params = await props.params;
  const slug = params.slug;

  const article = await getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <span className="p-3 inline-block bg-indigo-50 dark:bg-zinc-90 w-fit rounded-2xl mb-4 text-indigo-600 dark:text-indigo-400">
          <BookOpen className="h-6 w-6 animate-bounce" />
        </span>
        <h2 className="text-xl font-black text-slate-1000 dark:text-zinc-150 tracking-tight font-mono">Article Not Found</h2>
        <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
          The publication link may be expired, private, or has been deleted by its administrator.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold leading-none select-none"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Increment views count on load
  await incrementViews(article.slug);

  // Fetch current user and core comment list
  const currentUser = await getMe();
  const comments = await getCommentsByArticle(article.id);
  const { site_url: siteUrl } = await getPublicSiteSettings();

  // Helper to recursively parse ratings from comment tree
  const parseRatingsFromComments = (items: CommentWithUser[]) => {
    let sum = 0;
    let count = 0;

    const traverse = (list: CommentWithUser[]) => {
      list.forEach((item) => {
        let text = item.content;
        if (text.startsWith("[Guest: ")) {
          const m = text.match(/^\[Guest:\s*([^\]]+)\]\s*([\s\S]*)$/);
          if (m) text = m[2];
        }
        if (text.startsWith("[Rating: ")) {
          const m = text.match(/^\[Rating:\s*([1-5])\]\s*([\s\S]*)$/);
          if (m) {
            sum += parseInt(m[1], 10);
            count++;
          }
        }
        if (item.replies && item.replies.length > 0) {
          traverse(item.replies);
        }
      });
    };

    traverse(items);
    return { sum, count };
  };

  const { sum: totalRatingSum, count: ratingCount } = parseRatingsFromComments(comments);
  const averageRating = ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(1) : null;

  const htmlContent = renderArticleContent(article.content);

  // Simple statistics
  const wordCount = stripHtml(article.content).split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 225));

  // Enhanced Article JSON-LD
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}/blog/${article.slug}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${article.slug}`,
    },
    url: `${siteUrl}/blog/${article.slug}`,
    headline: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    image: article.ogImage || article.coverImage,
    thumbnailUrl: article.coverImage,
    keywords: article.metaKeywords || undefined,
    articleSection: article.category,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    wordCount,
    author: {
      "@type": "Person",
      name: article.author.name,
      url: `${siteUrl}/author/${article.author.id}`,
    },
    publisher: {
      "@type": "Organization",
      name: "ArticleDestiny",
      url: siteUrl,
    },
    isAccessibleForFree: true,
    inLanguage: "en",
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.category,
        item: `${siteUrl}/?category=${encodeURIComponent(article.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${siteUrl}/blog/${article.slug}`,
      },
    ],
  };

  return (
    <article className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Scroll Bar */}
      <ReadingProgressBar />

      {/* Tracker of Reading History (Client Action) */}
      <HistoryTracker
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          category: article.category,
          coverImage: article.coverImage,
          excerpt: article.excerpt,
        }}
        isAuthenticated={!!currentUser}
      />

      {/* Ad slot Top */}
      <AdSense placement="top" />

      {/* Back button link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-650 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Catalog Archive</span>
        </Link>
      </div>

      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/?category=${encodeURIComponent(article.category)}`} className="hover:text-indigo-600 transition-colors">{article.category}</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-zinc-400 truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Article Header Card */}
      <header className="space-y-5 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono select-none">
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
            <Clock className="h-3. w-3" />
            {readMinutes} min read
          </span>
          <span className="text-gray-300">-</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
            <Eye className="h-3. w-3" />
            {article.viewsCount + 1} Views
          </span>
          {averageRating !== null && (
            <>
              <span className="text-gray-300">-</span>
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-mono font-bold animate-pulse">
                ★ {averageRating} ({ratingCount} {ratingCount === 1 ? "review" : "reviews"})
              </span>
            </>
          )}
          {article.seoScore > 0 && (
            <>
              <span className="text-gray-300">-</span>
              <span className={`text-[10px] font-bold font-mono ${
                article.seoScore >= 80 ? "text-emerald-600" : article.seoScore >= 50 ? "text-amber-600" : "text-rose-500"
              }`}>
                SEO {article.seoScore}/100
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3.5xl font-bold text-slate-1000 dark:text-zinc-50 tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-xs sm:text-sm text-gray-505 dark:text-zinc-400 leading-relaxed font-normal italic border-l-2 border-indigo-200 pl-4 py-0.5">
          {article.excerpt}
        </p>

        {/* Profile Card */}
        <div className="pt-4 border-t border-gray-50 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <AuthorHoverCard author={article.author} publishedAt={article.createdAt} />

          {/* Social shares */}
          <ShareButton title={article.title} />
        </div>
      </header>

      {/* Hero Visual Image Banner */}
      <div className="w-full h-64 sm:h-96 relative overflow-hidden rounded-3xl border border-gray-105 dark:border-zinc-900 shadow-sm">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* In-article ad before content */}
      <AutoAdSlot format="in-article" />

      {/* Render Markdown Content block */}
      <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div
          id="article-body"
          className="prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* In-article ad after content */}
        <AutoAdSlot format="in-article" />

        {/* Action Bar ( Liking ) */}
        <div className="mt-12 pt-6 border-t border-gray-50 dark:border-zinc-900 flex items-center justify-between">
          <LikeButton articleId={article.id} initialLikes={article.likesCount} currentUser={currentUser} />
          <ShareButton title={article.title} />
        </div>

        {/* Ad slot Bottom */}
        <AdSense placement="bottom" />

        {/* Comments section block */}
        <CommentSection
          articleId={article.id}
          initialComments={comments}
          currentUser={currentUser}
        />
      </div>

      {/* Final bottom auto ad */}
      <AutoAdSlot format="display" />
    </article>
  );
}

