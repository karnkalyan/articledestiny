"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ArticleWithAuthor, CommentWithUser } from "@/types";
import { revalidatePath } from "next/cache";

function toPublicProfile(profile: any) {
  if (!profile) return null;

  return {
    userId: profile.userId,
    bio: profile.bioVisible ? profile.bio : null,
    location: profile.locationVisible ? profile.location : null,
    website: profile.websiteVisible ? profile.website : null,
    twitter: profile.twitterVisible ? profile.twitter : null,
    github: profile.githubVisible ? profile.github : null,
    linkedin: profile.linkedinVisible ? profile.linkedin : null,
    phone: profile.phoneVisible ? profile.phone : null,
    avatar: profile.avatarVisible ? profile.avatar : null,
    tagline: profile.taglineVisible ? profile.tagline : null,
  };
}

function withPublicAuthorProfile<T extends { author: any }>(article: T) {
  return {
    ...article,
    author: {
      ...article.author,
      profile: toPublicProfile(article.author?.profile),
    },
  };
}

function uniqueCategories(categories: string[]) {
  return Array.from(new Set(categories.map((item) => item.trim()).filter(Boolean)));
}

function parseSavedCategories(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return uniqueCategories(parsed.map(String));
  } catch (_) {
    return uniqueCategories(value.split(","));
  }
  return [];
}

export async function getArticles(category?: string): Promise<ArticleWithAuthor[]> {
  try {
    const where: any = { published: true };
    if (category && category !== "All") {
      where.category = category;
    }

    const articles = await db.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            createdAt: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return articles.map(withPublicAuthorProfile) as unknown as ArticleWithAuthor[];
  } catch (error) {
    console.error("Error getting articles:", error);
    return [];
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const [categories, savedCategories] = await Promise.all([
      db.article.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ["category"],
      }),
      db.siteSetting.findUnique({ where: { key: "catalog_categories" } }),
    ]);
    return ["All", ...uniqueCategories([...parseSavedCategories(savedCategories?.value), ...categories.map((c) => c.category)])];
  } catch (error) {
    return ["All"];
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithAuthor | null> {
  try {
    const article = await db.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            createdAt: true,
            profile: true,
          },
        },
      },
    });
    return article ? (withPublicAuthorProfile(article) as unknown as ArticleWithAuthor) : null;
  } catch (error) {
    console.error("Error getting article by slug:", error);
    return null;
  }
}

export async function incrementViews(slug: string) {
  try {
    await db.article.update({
      where: { slug },
      data: {
        viewsCount: { increment: 1 },
      },
    });
    return { success: true };
  } catch (error) {
    return { error: "Failed to increment views" };
  }
}

export async function toggleLikeArticle(articleId: number) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Must be logged in to like articles" };
    }

    const existingLike = await db.like.findUnique({
      where: {
        userId_articleId: {
          userId: session.id,
          articleId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await db.like.delete({
        where: {
          userId_articleId: {
            userId: session.id,
            articleId,
          },
        },
      });

      await db.article.update({
        where: { id: articleId },
        data: { likesCount: { decrement: 1 } },
      });

      return { liked: false };
    } else {
      // Like
      await db.like.create({
        data: {
          userId: session.id,
          articleId,
        },
      });

      await db.article.update({
        where: { id: articleId },
        data: { likesCount: { increment: 1 } },
      });

      return { liked: true };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { error: "Failed to like article" };
  }
}

export async function getArticleLikeStatus(articleId: number): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;

    const like = await db.like.findUnique({
      where: {
        userId_articleId: {
          userId: session.id,
          articleId,
        },
      },
    });

    return !!like;
  } catch (error) {
    return false;
  }
}

export async function getCommentsByArticle(articleId: number): Promise<CommentWithUser[]> {
  try {
    const dbComments = await db.comment.findMany({
      where: {
        articleId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build hierarchical replies in memory
    const commentMap = new Map<number, CommentWithUser>();
    const rootComments: CommentWithUser[] = [];

    dbComments.forEach((c) => {
      const commentWithReplies: CommentWithUser = {
        ...c,
        user: c.user as any,
        replies: [],
      };
      commentMap.set(c.id, commentWithReplies);
    });

    dbComments.forEach((c) => {
      const current = commentMap.get(c.id)!;
      if (c.parentId === null) {
        rootComments.push(current);
      } else {
        const parent = commentMap.get(c.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(current);
        } else {
          // If parent not found (or rejected), display at root for gracefulness
          rootComments.push(current);
        }
      }
    });

    return rootComments;
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}

export async function submitComment(articleId: number, content: string, parentId: number | null = null) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "Must be logged in to comment" };
    }

    if (session.isBanned) {
      return { error: "Your account is banned" };
    }

    if (!content.trim()) {
      return { error: "Comment content cannot be empty" };
    }

    // Default status: APPROVED (can be custom modified if moderation required)
    const newComment = await db.comment.create({
      data: {
        content: content.trim(),
        articleId,
        userId: session.id,
        parentId,
        status: "APPROVED",
      },
    });

    revalidatePath(`/blog/[slug]`, "layout");
    return { success: true, comment: newComment };
  } catch (error: any) {
    console.error("Error submitting comment:", error);
    return { error: error.message || "Failed to submit comment" };
  }
}
