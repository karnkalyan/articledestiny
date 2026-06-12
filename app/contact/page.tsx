export const revalidate = 0;

import React from "react";
import { db } from "@/lib/db";
import { ContactForm } from "@/components/ContactForm";
import { AutoAdSlot } from "@/components/AutoAdSlot";

export default async function ContactPage() {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["contact_eyebrow", "contact_title", "contact_description"] } },
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  const eyebrow = settings.contact_eyebrow || "Get in Touch";
  const title = settings.contact_title || "Connect with ArticleDestiny";
  const description = settings.contact_description || "Suggestions, submissions, editorial pitches, or general design reviews.";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <AutoAdSlot format="display" />

      <div className="text-center mb-12">
        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono select-none">
          {eyebrow}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-2.5 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
          {description}
        </p>
      </div>

      <ContactForm />

      <AutoAdSlot format="display" />
    </div>
  );
}
