export const revalidate = 0;

import React from "react";
import { Compass, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { renderArticleContent } from "@/lib/markdown";
import { AdSense } from "@/components/AdSense";

export default async function AboutPage() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["about_eyebrow", "about_title", "about_intro", "about_feature_one_title", "about_feature_one_body", "about_feature_two_title", "about_feature_two_body", "about_body", "about_features"] } },
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const eyebrow = settings.about_eyebrow || "Editorial Manifesto";
  const title = settings.about_title || "Where technology intersects human curiosity.";
  const intro = settings.about_intro || "ArticleDestiny is a boutique publishing engine curated to inspire and inform developers, digital designers, and tech enthusiasts.";
  const body = settings.about_body || "<p>Established in 2026, ArticleDestiny grew from a single developer's dissatisfaction with algorithmic content feeds. Recognizing the beauty in focused, long-form technical literature, we developed an application with an unyielding dedication to visual rhythm and structural clarity.</p><p>We hope our platform inspires you to think deeply, experiment creatively, and contribute constructively to the active dialogue thread below each article on our server.</p>";

  let features: Array<{ title: string; body: string }> = [];
  if (settings.about_features) {
    try {
      features = JSON.parse(settings.about_features);
    } catch (_) {}
  }

  if (features.length === 0) {
    features = [
      {
        title: settings.about_feature_one_title || "Curated Exploration",
        body: settings.about_feature_one_body || "Thoughtful stories, clean publishing, and a reading experience built for attention."
      },
      {
        title: settings.about_feature_two_title || "Privacy First Ecosystem",
        body: settings.about_feature_two_body || "Reader history stays local or securely tied to authenticated accounts."
      }
    ];
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <AdSense placement="top" />

      <div className="text-center mb-16">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest font-mono select-none">{eyebrow}</span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-zinc-100 mt-3 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl mx-auto">
          {intro}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
        {features.map((feat, i) => (
          <div key={i} className="p-6 bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl">
            <span className="p-2.5 inline-block bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 w-fit rounded-xl mb-4">
              {i % 2 === 0 ? <Compass className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </span>
            <h3 className="text-sm font-bold text-slate-1000 dark:text-zinc-200 uppercase tracking-wider font-mono">{feat.title}</h3>
            <p className="text-xs text-gray-550 dark:text-zinc-405 mt-2.5 leading-relaxed">
              {feat.body}
            </p>
          </div>
        ))}
      </div>

      <div
        className="prose dark:prose-invert text-sm text-slate-705 dark:text-zinc-300 leading-relaxed space-y-6"
        dangerouslySetInnerHTML={{ __html: renderArticleContent(body) }}
      />

      <AdSense placement="bottom" />
    </div>
  );
}
