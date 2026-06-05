"use client";

import React, { useState } from "react";
import { MessageSquare, Reply, CornerDownRight, AlertTriangle } from "lucide-react";
import { submitComment, getCommentsByArticle } from "@/actions/blog";
import { CommentWithUser, SafeUser } from "@/types";

interface CommentSectionProps {
  articleId: number;
  initialComments: CommentWithUser[];
  currentUser: SafeUser | null;
}

export function CommentSection({ articleId, initialComments, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
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
    if (!currentUser) {
      setErrorMsg("You must be logged in to post comments.");
      return;
    }
    if (!newCommentText.trim()) return;

    setLoading(true);
    setErrorMsg("");

    const res = await submitComment(articleId, newCommentText);
    if ("error" in res) {
      setErrorMsg(res.error);
    } else {
      setNewCommentText("");
      await refreshComments();
    }
    setLoading(false);
  };

  const handleCreateReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!replyText.trim()) return;

    setLoading(true);

    const res = await submitComment(articleId, replyText, parentId);
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
    return items.map((c) => (
      <div key={c.id} className={`flex flex-col gap-2 ${isReply ? "ml-6 pl-4 border-l-2 border-gray-100 dark:border-zinc-800 my-2" : "border-b border-gray-100 dark:border-zinc-900 pb-5 pt-3"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] uppercase">
              {c.user.name.substring(0, 2)}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{c.user.name}</span>
              <span className="text-[9px] text-gray-400 font-medium">{(c.user.role || "").toLowerCase()}</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <p className="text-sm text-slate-705 dark:text-zinc-300 font-normal pl-8 mt-0.5 leading-relaxed">
          {c.content}
        </p>

        {currentUser && !currentUser.isBanned && (
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
              <span>Replying to {c.user.name}</span>
            </div>
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
    ));
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

      {currentUser ? (
        currentUser.isBanned ? (
          <div className="p-4 bg-zinc-50 border dark:bg-zinc-900 dark:border-zinc-800 rounded-lg text-center text-sm text-gray-500">
            Your account has been banned from posting comments.
          </div>
        ) : (
          <form onSubmit={handleCreateComment} className="mb-8 flex flex-col gap-3">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Share your thoughts on this article..."
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
                {loading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="mb-8 p-4 bg-gradient-to-r from-gray-50 to-indigo-50/20 border border-gray-100 dark:from-zinc-950/20 dark:to-zinc-950 dark:border-zinc-850 rounded-xl text-center text-xs">
          <p className="text-gray-500 dark:text-zinc-400 font-medium mb-2.5">
            You must be logged in to join the conversation.
          </p>
          <a
            href="/login"
            className="app-primary-btn inline-block px-4 py-1.5 rounded-lg font-bold"
          >
            Sign In
          </a>
        </div>
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
