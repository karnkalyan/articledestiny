import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const media = await db.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return new NextResponse("Media Not Found", { status: 404 });
    }

    const buffer = Buffer.from(media.data, "base64");
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving media:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
