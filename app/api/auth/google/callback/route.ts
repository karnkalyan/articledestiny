import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { SafeUser } from "@/types";

const DEFAULT_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const DEFAULT_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    const origin = `${forwardedProto}://${forwardedHost}`;
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      console.error("[Google OAuth Callback Error Param]:", errorParam);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=No authorization code provided.", request.url));
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    // Fetch Google Credentials from database site settings
    const clientSetting = await db.siteSetting.findUnique({ where: { key: "google_client_id" } });
    const secretSetting = await db.siteSetting.findUnique({ where: { key: "google_client_secret" } });

    const clientId = clientSetting?.value || DEFAULT_CLIENT_ID;
    const clientSecret = secretSetting?.value || DEFAULT_CLIENT_SECRET;

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error("[Google Token Exchange Error]:", tokenError);
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve access token from Google.", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/login?error=Google access token not found in response.", request.url));
    }

    // Retrieve user details using access token
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve Google user profile.", request.url));
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email?.trim().toLowerCase();
    const name = userInfo.name?.trim() || userInfo.given_name?.trim() || "Google Reader";

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=Email address not provided by Google account.", request.url));
    }

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.isBanned) {
        return NextResponse.redirect(
          new URL("/login?error=This account has been banned by an administrator.", request.url)
        );
      }
    } else {
      // User doesn't exist - create new account
      const dummyPassword = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 10);
      const userCount = await db.user.count();

      // Set admin role if first user or email matches karnkalyan@gmail.com
      let role = userCount === 0 ? "ADMIN" : "USER";
      if (email === "karnkalyan@gmail.com") {
        role = "ADMIN";
      }

      user = await db.user.create({
        data: {
          email,
          password: dummyPassword,
          name,
          role,
        },
      });
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };

    // Create session cookie
    await createSession(safeUser);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: any) {
    console.error("[Google OAuth Callback Catch Error]:", error);
    return NextResponse.redirect(new URL("/login?error=An unexpected error occurred during login.", request.url));
  }
}
