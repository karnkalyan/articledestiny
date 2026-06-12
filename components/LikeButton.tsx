"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleLikeArticle, getArticleLikeStatus, toggleGuestLikeArticle } from "@/actions/blog";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  articleId: number;
  initialLikes: number;
  currentUser?: any;
}

export function LikeButton({ articleId, initialLikes, currentUser }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // Sync initialLikes when it changes from the server
  useEffect(() => {
    setLikesCount(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      if (currentUser) {
        const isLiked = await getArticleLikeStatus(articleId);
        if (active) {
          setLiked(isLiked);
        }
      } else {
        // Guest mode - check localStorage
        if (typeof window !== "undefined") {
          try {
            const likedList = JSON.parse(localStorage.getItem("guest_liked_articles") || "[]");
            if (active) {
              setLiked(Array.isArray(likedList) && likedList.includes(articleId));
            }
          } catch (_) {
            if (active) setLiked(false);
          }
        }
      }
    };

    fetchStatus();
    return () => {
      active = false;
    };
  }, [articleId, currentUser]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    if (currentUser) {
      const result = await toggleLikeArticle(articleId);
      if ("error" in result) {
        setErrorMsg("Failed to update like status");
        setTimeout(() => setErrorMsg(""), 3000);
      } else {
        setLiked(result.liked);
        setLikesCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } else {
      // Guest Liking Flow
      try {
        const likedListStr = localStorage.getItem("guest_liked_articles") || "[]";
        let likedList = JSON.parse(likedListStr);
        if (!Array.isArray(likedList)) {
          likedList = [];
        }

        const isLiking = !likedList.includes(articleId);
        const result = await toggleGuestLikeArticle(articleId, isLiking);

        if ("error" in result) {
          setErrorMsg("Failed to update guest like");
          setTimeout(() => setErrorMsg(""), 3000);
        } else {
          if (isLiking) {
            likedList.push(articleId);
          } else {
            likedList = likedList.filter((id: number) => id !== articleId);
          }
          localStorage.setItem("guest_liked_articles", JSON.stringify(likedList));
          setLiked(isLiking);
          setLikesCount((prev) => (isLiking ? prev + 1 : Math.max(0, prev - 1)));
        }
      } catch (_) {
        setErrorMsg("Failed to record guest like");
        setTimeout(() => setErrorMsg(""), 3000);
      }
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
          className="text-xs text-rose-500 dark:text-rose-400 font-medium animate-pulse"
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}
