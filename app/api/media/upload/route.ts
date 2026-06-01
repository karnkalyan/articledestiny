import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.isBanned || (session.role !== "ADMIN" && session.role !== "AUTHOR")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    // Read file content as arrayBuffer and convert to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Create database entry for media tracking
    const media = await db.media.create({
      data: {
        name: file.name,
        mimeType: file.type || "image/jpeg",
        data: base64Data,
        url: "temporary", // to be updated below
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

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error: any) {
    console.error("Error uploading media:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
