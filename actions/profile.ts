"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";
import { AuthorProfile, AuthorProfilePublic } from "@/types";
import { revalidatePath } from "next/cache";

/** Fetch the current logged-in user's full profile (for editing) */
export async function getMyProfile(): Promise<AuthorProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const profile = await db.authorProfile.findUnique({
    where: { userId: session.id },
  });

  return profile as AuthorProfile | null;
}

/** Update or create the current user's profile */
export async function updateMyProfile(data: {
  bio?: string;
  bioVisible?: boolean;
  location?: string;
  locationVisible?: boolean;
  website?: string;
  websiteVisible?: boolean;
  twitter?: string;
  twitterVisible?: boolean;
  github?: string;
  githubVisible?: boolean;
  linkedin?: string;
  linkedinVisible?: boolean;
  phone?: string;
  phoneVisible?: boolean;
  avatar?: string;
  avatarVisible?: boolean;
  tagline?: string;
  taglineVisible?: boolean;
}) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to update your profile." };
  }

  try {
    const payload = {
      bio: data.bio?.trim() || null,
      bioVisible: data.bioVisible ?? true,
      location: data.location?.trim() || null,
      locationVisible: data.locationVisible ?? true,
      website: data.website?.trim() || null,
      websiteVisible: data.websiteVisible ?? true,
      twitter: data.twitter?.trim() || null,
      twitterVisible: data.twitterVisible ?? true,
      github: data.github?.trim() || null,
      githubVisible: data.githubVisible ?? true,
      linkedin: data.linkedin?.trim() || null,
      linkedinVisible: data.linkedinVisible ?? true,
      phone: data.phone?.trim() || null,
      phoneVisible: data.phoneVisible ?? false,
      avatar: data.avatar?.trim() || null,
      avatarVisible: data.avatarVisible ?? true,
      tagline: data.tagline?.trim() || null,
      taglineVisible: data.taglineVisible ?? true,
    };

    const profile = await db.authorProfile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...payload },
      update: payload,
    });

    revalidatePath(`/author/${session.id}`);
    revalidatePath(`/author/${session.id}/edit`);
    revalidatePath("/");
    revalidatePath("/blog/[slug]", "layout");
    return { success: true, profile };
  } catch (error: any) {
    console.error("Error updating author profile:", error);
    return { error: error.message || "Failed to update profile." };
  }
}

export async function updateMyAccount(data: {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to update your account." };
  }

  try {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const currentPassword = data.currentPassword || "";
    const newPassword = data.newPassword || "";
    const confirmPassword = data.confirmPassword || "";

    if (!name) {
      return { error: "Name is required." };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "A valid email address is required." };
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
    });

    if (!user || user.isBanned) {
      return { error: "Account not found or unavailable." };
    }

    if (email !== user.email) {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return { error: "That email is already used by another account." };
      }
    }

    const payload: { name: string; email: string; password?: string } = {
      name,
      email,
    };

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        return { error: "Current password is required to change password." };
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return { error: "Current password is incorrect." };
      }

      if (newPassword.length < 6) {
        return { error: "New password must be at least 6 characters long." };
      }

      if (newPassword !== confirmPassword) {
        return { error: "New password and confirmation do not match." };
      }

      payload.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: payload,
    });

    const safeUser = {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      isBanned: updated.isBanned,
      createdAt: updated.createdAt,
    };

    await createSession(safeUser);
    revalidatePath(`/author/${updated.id}`);
    revalidatePath(`/author/${updated.id}/edit`);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/blog/[slug]", "layout");

    return { success: true, user: safeUser };
  } catch (error: any) {
    console.error("Error updating account:", error);
    return { error: error.message || "Failed to update account." };
  }
}

/** Fetch a public author profile — only fields where *Visible is true are returned */
export async function getPublicAuthorProfile(userId: number): Promise<AuthorProfilePublic | null> {
  try {
    const profile = await db.authorProfile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    const publicProfile: AuthorProfilePublic = { userId: profile.userId };

    if (profile.bioVisible) publicProfile.bio = profile.bio;
    if (profile.locationVisible) publicProfile.location = profile.location;
    if (profile.websiteVisible) publicProfile.website = profile.website;
    if (profile.twitterVisible) publicProfile.twitter = profile.twitter;
    if (profile.githubVisible) publicProfile.github = profile.github;
    if (profile.linkedinVisible) publicProfile.linkedin = profile.linkedin;
    if (profile.phoneVisible) publicProfile.phone = profile.phone;
    if (profile.avatarVisible) publicProfile.avatar = profile.avatar;
    if (profile.taglineVisible) publicProfile.tagline = profile.tagline;

    return publicProfile;
  } catch (error) {
    console.error("Error fetching public author profile:", error);
    return null;
  }
}

/** Admin can view the full author profile including hidden fields */
export async function getAuthorProfileForAdmin(userId: number): Promise<AuthorProfile | null> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return null;
  }

  try {
    const profile = await db.authorProfile.findUnique({
      where: { userId },
    });
    return profile as AuthorProfile | null;
  } catch (error) {
    console.error("Error fetching author profile for admin:", error);
    return null;
  }
}
