import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    // Basic session authorization guard
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "AUTHOR")) {
      return NextResponse.json({ error: "Prohibited" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
    }

    const articleId = parseInt(idParam);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
    }

    const article = await db.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error: any) {
    console.error("API error loading article:", error);
    return NextResponse.json({ error: error.message || "Failed to load article" }, { status: 500 });
  }
}
