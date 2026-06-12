import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export async function GET(request: NextRequest) {
  try {
    // Use forwarded headers from reverse proxy for correct public URL
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const origin = `${forwardedProto}://${forwardedHost}`;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Fetch Google Client ID from database site settings
    const clientSetting = await db.siteSetting.findUnique({
      where: { key: "google_client_id" },
    });
    const clientId = clientSetting?.value || DEFAULT_CLIENT_ID;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
      "openid email profile"
    )}`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (error: any) {
    console.error("[Google Login API Error]:", error);
    return NextResponse.redirect(new URL("/login?error=Google authentication could not be initialized.", origin));
  }
}
