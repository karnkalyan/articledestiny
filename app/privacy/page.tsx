export const revalidate = 0;

import React from "react";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { renderArticleContent } from "@/lib/markdown";
import { AdSense } from "@/components/AdSense";

export default async function PrivacyPolicyPage() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["privacy_title", "privacy_body"] } },
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  const title = settings.privacy_title || "Privacy Policy";
  const body = settings.privacy_body || `
    <h2>1. Information We Collect</h2>
    <p>We value your privacy. Your reading history stays local to your browser session using localStorage unless you choose to authenticate. If you create an account, we store your name, email address, profile settings, and interactions (such as likes and comments) to personalize your experience.</p>
    <h2>2. Data Usage & Security</h2>
    <p>Your details are never sold, rented, or distributed to third-party marketing entities. We strictly use configuration emails to notify you of subscriptions, newsletters, or replies to comments.</p>
    <h2>3. Cookies and Tracking</h2>
    <p>We use essential cookies to maintain user authentication sessions. Third-party services like Google Analytics and Google AdSense may collect standard device indicators and usage statistics if enabled by the site administration.</p>
  `;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <AdSense placement="top" />

      <div className="text-center mb-16">
        <span className="p-3.5 inline-flex bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 w-fit rounded-full mb-4">
          <ShieldCheck className="h-8 w-8 animate-pulse" />
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-gray-500 mt-2 select-none" suppressHydrationWarning>
          Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl p-8 sm:p-10 shadow-sm mb-12">
        <div
          className="prose dark:prose-invert text-sm text-slate-700 dark:text-zinc-300 leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: renderArticleContent(body) }}
        />
      </div>

      <AdSense placement="bottom" />
    </div>
  );
}
