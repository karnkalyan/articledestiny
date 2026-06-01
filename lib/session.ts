import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SafeUser } from "@/types";
import { db } from "@/lib/db";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-auth-key-change-in-production"
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(user: SafeUser) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isBanned: user.isBanned,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "none",
    path: "/",
  });
}

export async function getSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    console.log("[getSession] No session cookie found");
    return null;
  }

  const payload = await decrypt(session);
  if (!payload) {
    console.log("[getSession] Decryption failed or session expired");
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: Number(payload.id) },
    });

    if (!user) {
      console.log("[getSession] User not found in database for ID:", payload.id);
      return null;
    }

    console.log("[getSession] User found in DB. Role:", user.role, "Email:", user.email);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("[getSession] Database query threw an error:", error);
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      isBanned: payload.isBanned,
      createdAt: new Date(), // Dummy value for type compatibility
    };
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
