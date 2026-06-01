"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ReadingHistoryItem } from "@/types";
import { revalidatePath } from "next/cache";

export async function recordReadingHistory(articleId: number) {
  try {
    const session = await getSession();
    if (!session) {
      return { msg: "Anonymous, skip DB record schema" };
    }

    // Record reading history (upsert-style since it's a unique mapping of list)
    await db.readingHistory.upsert({
      where: {
        userId_articleId: {
          userId: session.id,
          articleId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId: session.id,
        articleId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording reading history:", error);
    return { error: "Failed to record reading history" };
  }
}

export async function getReadingHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const session = await getSession();
    if (!session) return [];

    const history = await db.readingHistory.findMany({
      where: {
        userId: session.id,
      },
      include: {
        article: {
          include: {
            author: {
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
        },
      },
      orderBy: {
        readAt: "desc",
      },
    });

    return history as unknown as ReadingHistoryItem[];
  } catch (error) {
    console.error("Error fetching reading history:", error);
    return [];
  }
}

export async function clearReadingHistory() {
  try {
    const session = await getSession();
    if (!session) return { error: "Not authenticated" };

    await db.readingHistory.deleteMany({
      where: {
        userId: session.id,
      },
    });

    revalidatePath("/history");
    return { success: true };
  } catch (error) {
    console.error("Error clearing history:", error);
    return { error: "Failed to clear reading history" };
  }
}
