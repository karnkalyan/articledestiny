"use client";

import React, { useState } from "react";
import { Twitter, Link as CopyIcon, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const twitterUrl = typeof window !== "undefined"
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
    : `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase font-semibold mr-1">Share</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={handleCopy}
        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
        title="Copy article link"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap animate-bounce font-sans font-medium dark:bg-zinc-800">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
