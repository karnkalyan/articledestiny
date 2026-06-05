"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
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
    return { success: true, profile };
  } catch (error: any) {
    console.error("Error updating author profile:", error);
    return { error: error.message || "Failed to update profile." };
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
