"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleLikeArticle, getArticleLikeStatus } from "@/actions/blog";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  articleId: number;
  initialLikes: number;
}

export function LikeButton({ articleId, initialLikes }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      const isLiked = await getArticleLikeStatus(articleId);
      if (active) {
        setLiked(isLiked);
      }
    };
    fetchStatus();
    return () => {
      active = false;
    };
  }, [articleId]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const result = await toggleLikeArticle(articleId);
    if ("error" in result) {
      setErrorMsg("Must sign in to like");
      setTimeout(() => setErrorMsg(""), 3000);
    } else {
      setLiked(result.liked);
      setLikesCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all ${
          liked
            ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-400"
            : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
        } active:scale-95`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current scale-110" : ""} transition-transform`} />
        <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
      </button>
      {errorMsg && (
        <span
          onClick={() => router.push("/login")}
          className="text-xs text-rose-500 dark:text-rose-400 font-medium hover:underline cursor-pointer animate-pulse"
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}
