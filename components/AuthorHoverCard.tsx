import Link from "next/link";
import type React from "react";
import { Calendar, ExternalLink, Github, Globe, Linkedin, MapPin, Phone } from "lucide-react";
import { AuthorProfilePublic, SafeUser } from "@/types";

interface AuthorHoverCardProps {
  author: SafeUser & { profile?: AuthorProfilePublic | null };
  publishedAt?: Date;
  compact?: boolean;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeExternalUrl(value: string, kind?: "twitter" | "github") {
  if (value.startsWith("http")) return value;
  if (kind === "twitter") return `https://x.com/${value.replace("@", "")}`;
  if (kind === "github") return `https://github.com/${value.replace("@", "")}`;
  return value;
}

export function AuthorHoverCard({ author, publishedAt, compact = false }: AuthorHoverCardProps) {
  const profile = author.profile;
  const avatar = profile?.avatar;
  const hasDetails = !!(
    profile?.tagline ||
    profile?.bio ||
    profile?.location ||
    profile?.website ||
    profile?.twitter ||
    profile?.github ||
    profile?.linkedin ||
    profile?.phone
  );

  return (
    <div className="relative z-[70] inline-flex max-w-full group/author hover:z-[9999]">
      <Link href={`/author/${author.id}`} className="flex min-w-0 items-center gap-2.5">
        {avatar ? (
          <img
            src={avatar}
            alt={author.name}
            className={`${compact ? "h-7 w-7" : "h-9 w-9"} shrink-0 rounded-full border border-indigo-100 object-cover shadow-sm dark:border-zinc-800`}
          />
        ) : (
          <span className={`${compact ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-xs"} shrink-0 rounded-full bg-[var(--grad-primary)] text-white flex items-center justify-center font-black uppercase shadow-sm`}>
            {initials(author.name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-slate-900 transition-colors group-hover/author:text-indigo-600 dark:text-white dark:group-hover/author:text-indigo-400">
            {author.name}
          </span>
          <span className="block truncate text-[10px] text-gray-400">
            {publishedAt
              ? `Published ${new Date(publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
              : profile?.tagline || author.role}
          </span>
        </span>
      </Link>

      <div className="pointer-events-none absolute left-0 top-full z-[9999] mt-3 w-[min(21rem,calc(100vw-2rem))] translate-y-1 rounded-2xl border border-gray-100 bg-white p-4 text-left opacity-0 shadow-2xl shadow-slate-900/20 transition-all duration-200 group-hover/author:pointer-events-auto group-hover/author:translate-y-0 group-hover/author:opacity-100 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50">
        <div className="flex items-start gap-3">
          {avatar ? (
            <img src={avatar} alt={author.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="h-12 w-12 shrink-0 rounded-full bg-[var(--grad-primary)] text-white flex items-center justify-center text-sm font-black">
              {initials(author.name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/author/${author.id}`} className="block truncate text-sm font-black text-slate-950 hover:text-indigo-600 dark:text-zinc-50 dark:hover:text-indigo-400">
              {author.name}
            </Link>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{author.role}</p>
            {profile?.tagline && <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-zinc-300">{profile.tagline}</p>}
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-600 dark:text-zinc-400">{profile.bio}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-gray-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 dark:bg-zinc-900">
            <Calendar className="h-3 w-3" />
            Since {new Date(author.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
          {profile?.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 dark:bg-zinc-900">
              <MapPin className="h-3 w-3" />
              {profile.location}
            </span>
          )}
        </div>

        {hasDetails && (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile?.website && <AuthorLink href={profile.website} label="Website" icon={<Globe className="h-3 w-3" />} />}
            {profile?.twitter && <AuthorLink href={normalizeExternalUrl(profile.twitter, "twitter")} label="X" icon={<ExternalLink className="h-3 w-3" />} />}
            {profile?.github && <AuthorLink href={normalizeExternalUrl(profile.github, "github")} label="GitHub" icon={<Github className="h-3 w-3" />} />}
            {profile?.linkedin && <AuthorLink href={profile.linkedin} label="LinkedIn" icon={<Linkedin className="h-3 w-3" />} />}
            {profile?.phone && <AuthorLink href={`tel:${profile.phone}`} label={profile.phone} icon={<Phone className="h-3 w-3" />} />}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthorLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-indigo-300"
    >
      {icon}
      {label}
    </a>
  );
}
