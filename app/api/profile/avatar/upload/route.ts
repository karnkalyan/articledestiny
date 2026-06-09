import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.isBanned) {
      return NextResponse.json({ error: "Please sign in to upload a profile image." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image was uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Profile image must be an image file." }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "Profile image must be 5 MB or smaller." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const media = await db.media.create({
      data: {
        name: `avatar-${session.id}-${file.name}`,
        mimeType: file.type || "image/jpeg",
        data: buffer.toString("base64"),
        url: "temporary",
      },
    });

    const mediaUrl = `/api/media/${media.id}`;
    const updatedMedia = await db.media.update({
      where: { id: media.id },
      data: { url: mediaUrl },
      select: {
        id: true,
        name: true,
        mimeType: true,
        url: true,
        createdAt: true,
      },
    });

    await db.authorProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        avatar: updatedMedia.url,
        avatarVisible: true,
      },
      update: {
        avatar: updatedMedia.url,
        avatarVisible: true,
      },
    });

    return NextResponse.json({ success: true, media: updatedMedia });
  } catch (error: any) {
    console.error("Error uploading profile avatar:", error);
    return NextResponse.json({ error: error.message || "Failed to upload profile image." }, { status: 500 });
  }
}
