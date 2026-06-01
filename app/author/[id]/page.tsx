import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Compass } from "lucide-react";
import { db } from "@/lib/db";

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuthorProfilePage(props: AuthorPageProps) {
  const params = await props.params;
  const authorId = parseInt(params.id);

  if (isNaN(authorId)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold">Invalid Author ID</h2>
        <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  // Fetch author details
  const author = await db.user.findUnique({
    where: { id: authorId },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!author) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold">Author Not Found</h2>
        <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  // Fetch author's articles
  const articles = await db.article.findMany({
    where: {
      authorId: author.id,
      published: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Return arrow */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-650 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Author summary banner */}
      <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-750 flex items-center justify-center text-xl font-black uppercase shrink-0 dark:bg-zinc-850 dark:text-zinc-300">
          {author.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="text-center md:text-left space-y-1">
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Archive Portal</span>
          <h1 className="text-2xl font-black text-slate-1000 dark:text-zinc-50 tracking-tight leading-none mt-1">
            {author.name}
          </h1>
          <p className="text-xs text-gray-400">
            Official {author.role.toLowerCase()} profile • Partnered member since {new Date(author.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Articles grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-1000 dark:text-zinc-150 uppercase tracking-widest font-mono border-b border-gray-100 dark:border-zinc-900 pb-3">
          Published Submissions ({articles.length})
        </h3>

        {articles.length === 0 ? (
          <div className="py-16 text-center bg-white border rounded-2xl dark:bg-zinc-950 dark:border-zinc-900">
            <BookOpen className="h-8 w-8 text-gray-300 dark:text-zinc-800 mx-auto stroke-1" />
            <p className="text-xs text-gray-400 italic mt-2">This author has not published any pieces yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                className="group bg-white border border-gray-100 dark:bg-zinc-955 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 relative overflow-hidden bg-gray-50 border-b border-gray-50 dark:border-zinc-900">
                    <img src={art.coverImage} className="w-full h-full object-cover" alt={art.title} />
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest font-mono">{art.category}</span>
                    <h3 className="text-base font-bold text-slate-1000 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-tight tracking-tight">
                      <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{art.excerpt}</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-gray-50 dark:border-zinc-900/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(art.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <Link href={`/blog/${art.slug}`} className="text-xs font-bold text-indigo-650 hover:underline">Read Article →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
