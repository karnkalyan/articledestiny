"use client";

import React, { useState } from "react";
import { MessageSquare, Reply, CornerDownRight, AlertTriangle, Star } from "lucide-react";
import { submitComment, getCommentsByArticle, submitGuestComment } from "@/actions/blog";
import { CommentWithUser, SafeUser } from "@/types";

interface CommentSectionProps {
  articleId: number;
  initialComments: CommentWithUser[];
  currentUser: SafeUser | null;
}

export function CommentSection({ articleId, initialComments, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshComments = async () => {
    const fresh = await getCommentsByArticle(articleId);
    setComments(fresh);
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setLoading(true);
    setErrorMsg("");

    let res;
    if (currentUser) {
      res = await submitComment(articleId, newCommentText, null, rating);
    } else {
      res = await submitGuestComment(articleId, newCommentText, guestName || "Guest", null, rating);
    }

    if ("error" in res) {
      setErrorMsg(res.error);
    } else {
      setNewCommentText("");
      setRating(null);
      await refreshComments();
    }
    setLoading(false);
  };

  const handleCreateReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);

    let res;
    if (currentUser) {
      res = await submitComment(articleId, replyText, parentId, null);
    } else {
      res = await submitGuestComment(articleId, replyText, guestName || "Guest", parentId, null);
    }

    if ("error" in res) {
      setErrorMsg(res.error);
    } else {
      setReplyText("");
      setReplyToId(null);
      await refreshComments();
    }
    setLoading(false);
  };

  const renderCommentTree = (items: CommentWithUser[], isReply = false) => {
    return items.map((c) => {
      let displayName = c.user.name;
      let displayContent = c.content;
      let isGuest = false;
      let commentRating: number | null = null;

      // Parse metadata from comment content if present
      if (displayContent.startsWith("[Guest: ")) {
        const guestMatch = displayContent.match(/^\[Guest:\s*([^\]]+)\]\s*([\s\S]*)$/);
        if (guestMatch) {
          displayName = guestMatch[1];
          displayContent = guestMatch[2];
          isGuest = true;
        }
      }

      if (displayContent.startsWith("[Rating: ")) {
        const ratingMatch = displayContent.match(/^\[Rating:\s*([1-5])\]\s*([\s\S]*)$/);
        if (ratingMatch) {
          commentRating = parseInt(ratingMatch[1], 10);
          displayContent = ratingMatch[2];
        }
      }

      return (
        <div key={c.id} className={`flex flex-col gap-2 ${isReply ? "ml-6 pl-4 border-l-2 border-gray-100 dark:border-zinc-800 my-2" : "border-b border-gray-100 dark:border-zinc-900 pb-5 pt-3"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] uppercase">
                {displayName.substring(0, 2)}
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{displayName}</span>
                  {isGuest && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-zinc-850 dark:text-zinc-400 text-[8px] font-extrabold uppercase tracking-wider scale-90">
                      Guest
                    </span>
                  )}
                  {commentRating !== null && (
                    <div className="flex items-center gap-0.5 ml-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3 w-3 ${
                            idx < (commentRating || 0)
                              ? "text-amber-500 fill-amber-500"
                              : "text-gray-200 dark:text-zinc-800"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 font-medium">
                  {isGuest ? "guest" : (c.user.role || "").toLowerCase()}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <p className="text-sm text-slate-705 dark:text-zinc-300 font-normal pl-8 mt-0.5 leading-relaxed">
            {displayContent}
          </p>

          {(!currentUser || !currentUser.isBanned) && (
            <div className="pl-8 flex items-center gap-4">
              <button
                onClick={() => {
                  setReplyToId(replyToId === c.id ? null : c.id);
                  setReplyText("");
                  setErrorMsg("");
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
              >
                <Reply className="h-3 w-3" />
                <span>Reply</span>
              </button>
            </div>
          )}

          {replyToId === c.id && (
            <form onSubmit={(e) => handleCreateReply(e, c.id)} className="ml-8 mt-2 flex flex-col gap-2 pl-2 border-l border-indigo-200">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                <CornerDownRight className="h-3 w-3" />
                <span>Replying to {displayName}</span>
              </div>

              {!currentUser && (
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-48 text-[11px] rounded-lg border border-gray-200 bg-transparent px-2.5 py-1.5 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/40 font-semibold mb-2"
                />
              )}

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a supportive reply..."
                rows={2}
                className="w-full text-sm rounded-lg border border-gray-200 bg-transparent p-2.5 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950/40"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyToId(null)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="app-primary-btn px-3 py-1 text-xs rounded-md font-semibold"
                >
                  {loading ? "Posting..." : "Reply"}
                </button>
              </div>
            </form>
          )}

          {c.replies && c.replies.length > 0 && renderCommentTree(c.replies, true)}
        </div>
      );
    });
  };

  return (
    <div className="mt-12 border-t border-gray-100 dark:border-zinc-850 pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
          Comments ({comments.length})
        </h3>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {currentUser && currentUser.isBanned ? (
        <div className="p-4 bg-zinc-50 border dark:bg-zinc-900 dark:border-zinc-800 rounded-lg text-center text-sm text-gray-500">
          Your account has been banned from posting comments.
        </div>
      ) : (
        <form onSubmit={handleCreateComment} className="mb-8 flex flex-col gap-3">
          {!currentUser && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="w-full sm:w-1/3">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full text-xs rounded-xl border border-gray-200 bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-805 dark:bg-zinc-950 font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
                Commenting as a guest. Or,{" "}
                <a href="/login" className="text-indigo-500 font-bold hover:underline">
                  Sign In
                </a>{" "}
                to save preferences.
              </p>
            </div>
          )}

          {/* Star Rating Select Tool */}
          <div className="flex items-center gap-2 py-1 bg-slate-50/50 dark:bg-zinc-900/30 px-3 rounded-xl border border-dashed border-gray-150 dark:border-zinc-900 w-fit">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-zinc-400">
              Your Review Rating:
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => {
                const starValue = idx + 1;
                const active = rating !== null && starValue <= rating;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRating(rating === starValue ? null : starValue)}
                    className="text-gray-300 hover:text-amber-400 transition-colors p-0.5"
                    title={`Rate ${starValue} Stars`}
                  >
                    <Star
                      className={`h-4.5 w-4.5 transition-transform hover:scale-110 ${
                        active ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-zinc-800"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {rating !== null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-[9px] font-bold text-rose-500 hover:underline uppercase tracking-wider ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              rating !== null
                ? `Write a review for your ${rating}-star rating...`
                : "Share your thoughts on this article..."
            }
            rows={3}
            className="w-full text-sm rounded-xl border border-gray-200 bg-transparent p-3 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-805 dark:bg-zinc-950"
            required
          />
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="app-primary-btn px-4.5 py-2 active:scale-95 text-xs font-bold tracking-wide rounded-xl transition-all"
            >
              {loading ? "Posting..." : rating !== null ? "Submit Review" : "Post Comment"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-1">
        {comments.length === 0 ? (
          <p className="text-center text-gray-450 dark:text-zinc-500 py-6 text-xs italic">
            No comments yet. Be the first to start the discussion!
          </p>
        ) : (
          renderCommentTree(comments)
        )}
      </div>
    </div>
  );
}
