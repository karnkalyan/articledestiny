"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Article, ReviewItem, SafeUser, Ad } from "@/types";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { generateSeo } from "@/lib/seo";
import { notifySubscribersForArticle } from "@/lib/mail";

// Helper to assert admin or author role
async function requireRole(allowedRoles: string[]) {
  const session = await getSession();
  if (!session || session.isBanned) {
    throw new Error("Unauthorized: Please log in first.");
  }
  if (!allowedRoles.includes(session.role)) {
    throw new Error("Unauthorized: Permission denied.");
  }
  return session;
}

export async function getAdminStats() {
  await requireRole(["ADMIN", "AUTHOR"]);

  try {
    const totalArticles = await db.article.count();
    const totalUsers = await db.user.count();
    const totalComments = await db.comment.count();
    const totalSubscribers = await db.subscriber.count({ where: { active: true } });
    const totalMessages = await db.contactMessage.count();
    const pendingComments = await db.comment.count({ where: { status: "PENDING" } });

    // Sum of views
    const articlesForViews = await db.article.findMany({ select: { viewsCount: true } });
    const totalViews = articlesForViews.reduce((acc, current) => acc + current.viewsCount, 0);

    const categories = await db.article.findMany({ select: { category: true }, distinct: ["category"] });

    return {
      totalArticles,
      totalUsers,
      totalComments,
      pendingComments,
      totalViews,
      categoriesCount: categories.length,
      totalSubscribers,
      totalMessages,
    };
  } catch (error) {
    console.error("Error gathering stats:", error);
    return {
      totalArticles: 0,
      totalUsers: 0,
      totalComments: 0,
      pendingComments: 0,
      totalViews: 0,
      categoriesCount: 0,
      totalSubscribers: 0,
      totalMessages: 0,
    };
  }
}

export async function getArticlesForAdmin(): Promise<Article[]> {
  await requireRole(["ADMIN", "AUTHOR"]);
  try {
    const articles = await db.article.findMany({
      orderBy: { createdAt: "desc" },
    });
    return articles as unknown as Article[];
  } catch (error) {
    return [];
  }
}

export async function getCommentsForAdmin(): Promise<ReviewItem[]> {
  await requireRole(["ADMIN"]);
  try {
    const comments = await db.comment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        article: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      status: c.status,
      createdAt: c.createdAt,
      articleTitle: c.article.title,
      articleSlug: c.article.slug,
      userEmail: c.user.email,
      userName: c.user.name,
    }));
  } catch (error) {
    console.error("Error loading reviews for admin:", error);
    return [];
  }
}

export async function getUsersForAdmin(): Promise<SafeUser[]> {
  await requireRole(["ADMIN"]);
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
    }));
  } catch (error) {
    return [];
  }
}

export async function getAdsForAdmin(): Promise<Ad[]> {
  await requireRole(["ADMIN"]);
  try {
    // Populate defaults if none exist
    const defaultPlacements = ["top", "sidebar", "bottom"];
    for (const p of defaultPlacements) {
      const existing = await db.ad.findUnique({ where: { placement: p } });
      if (!existing) {
        await db.ad.create({
          data: {
            placement: p,
            code: `<div class="bg-indigo-50 border border-indigo-200 text-indigo-805 rounded p-4 text-center text-xs dark:bg-zinc-900/60 dark:border-zinc-800"><p class="font-bold uppercase tracking-widest text-[9px] text-gray-400 mb-1">Sponsored Advertisement</p><a href="#" class="hover:underline">Discover premium developer tooling at ArticleDestiny Partners</a></div>`,
            active: true,
          },
        });
      }
    }

    const ads = await db.ad.findMany();
    return ads as unknown as Ad[];
  } catch (error) {
    return [];
  }
}

export async function writeArticle(articleData: {
  id?: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  focusKeyword?: string;
}) {
  const session = await requireRole(["ADMIN", "AUTHOR"]);

  try {
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const seo = generateSeo(articleData);
    const payload = {
      title: articleData.title,
      excerpt: seo.excerpt,
      content: articleData.content,
      category: articleData.category || "General",
      coverImage: articleData.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
      published: articleData.published,
      authorId: session.id,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      canonicalUrl: seo.canonicalUrl || null,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage || null,
      twitterTitle: seo.twitterTitle,
      twitterDescription: seo.twitterDescription,
      twitterImage: seo.twitterImage || null,
      focusKeyword: seo.focusKeyword,
      seoScore: seo.seoScore,
    };

    if (articleData.id) {
      // Edit
      const updated = await db.article.update({
        where: { id: articleData.id },
        data: {
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          category: payload.category,
          coverImage: payload.coverImage,
          published: payload.published,
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          metaKeywords: payload.metaKeywords,
          canonicalUrl: payload.canonicalUrl,
          ogTitle: payload.ogTitle,
          ogDescription: payload.ogDescription,
          ogImage: payload.ogImage,
          twitterTitle: payload.twitterTitle,
          twitterDescription: payload.twitterDescription,
          twitterImage: payload.twitterImage,
          focusKeyword: payload.focusKeyword,
          seoScore: payload.seoScore,
        },
      });
      revalidatePath("/");
      revalidatePath(`/blog/${updated.slug}`);
      return { success: true, article: updated };
    } else {
      // Create - check for uniqueness of slug
      let finalSlug = slug;
      let count = 1;
      while (true) {
        const existing = await db.article.findUnique({ where: { slug: finalSlug } });
        if (!existing) break;
        finalSlug = `${slug}-${count}`;
        count++;
      }

      const created = await db.article.create({
        data: {
          ...payload,
          slug: finalSlug,
        },
      });
      if (created.published) {
        await notifySubscribersForArticle(created).catch((error) => {
          console.error("Subscriber notification failed:", error);
        });
      }
      revalidatePath("/");
      return { success: true, article: created };
    }
  } catch (error: any) {
    console.error("Error writing article:", error);
    return { error: error.message || "Failed to save article" };
  }
}

export async function getSubscribersForAdmin() {
  await requireRole(["ADMIN"]);
  return db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getContactMessagesForAdmin() {
  await requireRole(["ADMIN"]);
  return db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function updateContactMessageStatus(id: number, status: string) {
  await requireRole(["ADMIN"]);
  await db.contactMessage.update({ where: { id }, data: { status } });
  return { success: true };
}

export async function deleteSubscriber(id: number) {
  await requireRole(["ADMIN"]);
  await db.subscriber.delete({ where: { id } });
  return { success: true };
}

export async function getSiteSettingsForAdmin() {
  await requireRole(["ADMIN"]);
  const rows = await db.siteSetting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function saveSiteSettings(settings: Record<string, string>) {
  await requireRole(["ADMIN"]);
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  revalidatePath("/about");
  return { success: true };
}

export async function deleteArticle(id: number) {
  await requireRole(["ADMIN", "AUTHOR"]);
  try {
    await db.article.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete article" };
  }
}

export async function handleReviewAction(commentId: number, actionType: "APPROVE" | "REJECT" | "SPAM" | "DELETE") {
  await requireRole(["ADMIN"]);
  try {
    if (actionType === "DELETE") {
      await db.comment.delete({ where: { id: commentId } });
    } else {
      const statusMap = {
        APPROVE: "APPROVED",
        REJECT: "REJECTED",
        SPAM: "SPAM",
      };
      await db.comment.update({
        where: { id: commentId },
        data: { status: statusMap[actionType] },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to process moderation action" };
  }
}

export async function handleUserRoleOrBan(targetUserId: number, currentRole: string, currentBan: boolean, act: "role" | "ban") {
  await requireRole(["ADMIN"]);
  try {
    const session = await getSession();
    if (session?.id === targetUserId) {
      return { error: "You cannot change your own role or ban status" };
    }

    if (act === "role") {
      const nextRole = currentRole === "ADMIN" ? "AUTHOR" : currentRole === "AUTHOR" ? "USER" : "ADMIN";
      await db.user.update({
        where: { id: targetUserId },
        data: { role: nextRole },
      });
    } else {
      await db.user.update({
        where: { id: targetUserId },
        data: { isBanned: !currentBan },
      });
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to update user setting" };
  }
}

export async function saveAd(placement: string, code: string, active: boolean) {
  await requireRole(["ADMIN"]);
  try {
    await db.ad.upsert({
      where: { placement },
      update: { code, active },
      create: { placement, code, active },
    });
    return { success: true };
  } catch (error) {
    return { error: "Failed to save ad settings" };
  }
}

export async function getLiveAdByPlacement(placement: string): Promise<Ad | null> {
  try {
    const ad = await db.ad.findFirst({
      where: { placement, active: true },
    });
    return ad as unknown as Ad;
  } catch (error) {
    return null;
  }
}

export async function createUserFromAdmin(data: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) {
  await requireRole(["ADMIN"]);

  try {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const role = data.role;
    const password = data.password || "user123";

    if (!name || !email || !role) {
      return { error: "Name, email, and role are required." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email already registered in system." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    revalidatePath("/admin");
    return { success: true, user: created };
  } catch (error: any) {
    console.error("Error creating user from admin:", error);
    return { error: error.message || "Failed to create user" };
  }
}

export async function getMediaForAdmin() {
  await requireRole(["ADMIN", "AUTHOR"]);
  try {
    const list = await db.media.findMany({
      select: {
        id: true,
        name: true,
        mimeType: true,
        url: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return list;
  } catch (error) {
    console.error("Error fetching media catalog:", error);
    return [];
  }
}

export async function deleteMedia(id: number) {
  await requireRole(["ADMIN", "AUTHOR"]);
  try {
    await db.media.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting media from db:", error);
    return { error: "Failed to delete media asset" };
  }
}
