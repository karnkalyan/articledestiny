import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Globe,
  Phone,
  Edit,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { db } from "@/lib/db";
import { getMe } from "@/actions/auth";
import { getPublicAuthorProfile } from "@/actions/profile";
import { getPublicSiteSettings } from "@/lib/site";
import { AdSense } from "@/components/AdSense";
import { AutoAdSlot } from "@/components/AutoAdSlot";

interface AuthorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: AuthorPageProps): Promise<Metadata> {
  const params = await props.params;
  const authorId = parseInt(params.id);

  if (isNaN(authorId)) {
    return { title: "Invalid Author | ArticleDestiny" };
  }

  const author = await db.user.findUnique({
    where: { id: authorId },
    select: { name: true },
  });

  if (!author) {
    return { title: "Author Not Found | ArticleDestiny" };
  }

  const profile = await getPublicAuthorProfile(authorId);
  const { site_url: siteUrl } = await getPublicSiteSettings();

  return {
    title: `${author.name} - Author Profile`,
    description: profile?.tagline || profile?.bio || `Read articles by ${author.name} on ArticleDestiny.`,
    alternates: { canonical: `${siteUrl}/author/${authorId}` },
    openGraph: {
      type: "profile",
      title: `${author.name} - ArticleDestiny`,
      description: profile?.tagline || `Explore stories and articles by ${author.name}.`,
      images: profile?.avatar ? [{ url: profile.avatar, alt: author.name }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${author.name} - ArticleDestiny`,
      description: profile?.tagline || `Explore stories by ${author.name}.`,
    },
  };
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

  // Fetch profile (public fields only)
  const profile = await getPublicAuthorProfile(authorId);
  const currentUser = await getMe();
  const isOwnerOrAdmin = currentUser && (currentUser.id === author.id || currentUser.role === "ADMIN");
  const { site_url: siteUrl } = await getPublicSiteSettings();

  // Fetch author's articles
  const articles = await db.article.findMany({
    where: {
      authorId: author.id,
      published: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // JSON-LD for Person schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${siteUrl}/author/${author.id}`,
    ...(profile?.bio && { description: profile.bio }),
    ...(profile?.avatar && { image: profile.avatar }),
    ...(profile?.website && { sameAs: [profile.website] }),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Return arrow */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-650 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Catalog</span>
        </Link>

        {isOwnerOrAdmin && (
          <Link
            href={`/author/${author.id}/edit`}
            className="app-primary-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Link>
        )}
      </div>

      {/* Author summary banner */}
      <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
        {/* Gradient header bar */}
        <div className="h-28 bg-[var(--grad-primary)] relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
        </div>

        <div className="px-5 sm:px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar */}
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={author.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-950 shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[var(--grad-primary)] text-white flex items-center justify-center text-2xl font-black uppercase border-4 border-white dark:border-zinc-950 shadow-lg">
                {author.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-center md:text-left space-y-2 flex-1 pt-2 min-w-0">
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                Archive Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-tight mt-1 break-words">
                {author.name}
              </h1>

              {profile?.tagline && (
                <p className="text-base text-gray-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {profile.tagline}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-3">
                <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  <Calendar className="h-3 w-3" />
                  Member since{" "}
                  {new Date(author.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {profile?.location && (
                  <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                )}

                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-[9px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono">
                  {author.role}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="mt-7 pt-6 border-t border-gray-100 dark:border-zinc-900">
              <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-8 whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Social Links */}
          {(profile?.website || profile?.twitter || profile?.github || profile?.linkedin || profile?.phone) && (
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2.5">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 transition-all"
                >
                  <Globe className="h-3 w-3" />
                  Website
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={profile.twitter.startsWith("http") ? profile.twitter : `https://x.com/${profile.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 transition-all"
                >
                  X / Twitter
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {profile.github && (
                <a
                  href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 transition-all"
                >
                  GitHub
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 transition-all"
                >
                  LinkedIn
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 transition-all"
                >
                  <Phone className="h-3 w-3" />
                  {profile.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ad slot */}
      <AdSense placement="top" />

      {/* Articles grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-widest font-mono border-b border-gray-100 dark:border-zinc-900 pb-3">
          Published Submissions ({articles.length})
        </h3>

        {articles.length === 0 ? (
          <div className="py-16 text-center bg-white border rounded-2xl dark:bg-zinc-950 dark:border-zinc-900">
            <BookOpen className="h-8 w-8 text-gray-300 dark:text-zinc-800 mx-auto stroke-1" />
            <p className="text-xs text-gray-400 italic mt-2">This author has not published any pieces yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {articles.map((art, index) => (
              <React.Fragment key={art.id}>
                <div
                  className="group bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 relative overflow-hidden bg-gray-50 border-b border-gray-50 dark:border-zinc-900">
                      <img src={art.coverImage} className="w-full h-full object-cover" alt={art.title} />
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest font-mono">{art.category}</span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-tight tracking-tight">
                        <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{art.excerpt}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-3 border-t border-gray-50 dark:border-zinc-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(art.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <Link href={`/blog/${art.slug}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Read Article -&gt;</Link>
                  </div>
                </div>

                {/* In-feed ad after every 4th article */}
                {(index + 1) % 4 === 0 && index < articles.length - 1 && (
                  <div className="sm:col-span-2">
                    <AutoAdSlot format="in-feed" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Bottom ad */}
      <AdSense placement="bottom" />
    </div>
  );
}
