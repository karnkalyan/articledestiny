"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { SafeUser } from "@/types";
import { ensureSeeded } from "@/lib/seed";

export async function registerUser(formData: FormData) {
  try {
    await ensureSeeded();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const name = formData.get("name")?.toString().trim();

    if (!email || !password || !name) {
      return { error: "All fields are required" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Bootstrap first user as ADMIN
    const userCount = await db.user.count();
    let role = userCount === 0 ? "ADMIN" : "USER";
    if (email === "karnkalyan@gmail.com") {
      role = "ADMIN";
    }

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    const safeUser: SafeUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isBanned: newUser.isBanned,
      createdAt: newUser.createdAt,
    };

    await createSession(safeUser);
    return { success: true, user: safeUser };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: error.message || "Something went wrong during registration" };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await ensureSeeded();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    if (user.isBanned) {
      return { error: "This account has been banned by an administrator" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: "Invalid email or password" };
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };

    await createSession(safeUser);
    return { success: true, user: safeUser };
  } catch (error: any) {
    console.error("Login error:", error);
    return { error: error.message || "Something went wrong during login" };
  }
}

export async function getMe(): Promise<SafeUser | null> {
  await ensureSeeded();
  return await getSession();
}

export async function logoutUser() {
  await deleteSession();
  return { success: true };
}
