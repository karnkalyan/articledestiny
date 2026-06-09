"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Globe, MapPin, Phone, Save, Sparkles, UploadCloud } from "lucide-react";
import { getMyProfile, updateMyProfile } from "@/actions/profile";
import { AuthorProfile, SafeUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileForm = {
  bio: string;
  bioVisible: boolean;
  location: string;
  locationVisible: boolean;
  website: string;
  websiteVisible: boolean;
  twitter: string;
  twitterVisible: boolean;
  github: string;
  githubVisible: boolean;
  linkedin: string;
  linkedinVisible: boolean;
  phone: string;
  phoneVisible: boolean;
  avatar: string;
  avatarVisible: boolean;
  tagline: string;
  taglineVisible: boolean;
};

const defaultProfileForm: ProfileForm = {
  bio: "",
  bioVisible: true,
  location: "",
  locationVisible: true,
  website: "",
  websiteVisible: true,
  twitter: "",
  twitterVisible: true,
  github: "",
  githubVisible: true,
  linkedin: "",
  linkedinVisible: true,
  phone: "",
  phoneVisible: false,
  avatar: "",
  avatarVisible: true,
  tagline: "",
  taglineVisible: true,
};

const profileFields = [
  { key: "tagline", label: "Tagline", icon: Sparkles, type: "text", placeholder: "Full-stack developer and writer" },
  { key: "bio", label: "Bio", icon: FileText, type: "textarea", placeholder: "Tell readers about your work, experience, and interests." },
  { key: "location", label: "Location", icon: MapPin, type: "text", placeholder: "Kathmandu, Nepal" },
  { key: "website", label: "Website", icon: Globe, type: "url", placeholder: "https://example.com" },
  { key: "twitter", label: "Twitter / X", icon: Globe, type: "text", placeholder: "@username or full URL" },
  { key: "github", label: "GitHub", icon: Globe, type: "text", placeholder: "username or full URL" },
  { key: "linkedin", label: "LinkedIn", icon: Globe, type: "url", placeholder: "https://linkedin.com/in/username" },
  { key: "phone", label: "Phone", icon: Phone, type: "tel", placeholder: "+977-98XXXXXXXX" },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function profileToForm(profile: AuthorProfile | null): ProfileForm {
  if (!profile) return defaultProfileForm;
  return {
    bio: profile.bio || "",
    bioVisible: profile.bioVisible,
    location: profile.location || "",
    locationVisible: profile.locationVisible,
    website: profile.website || "",
    websiteVisible: profile.websiteVisible,
    twitter: profile.twitter || "",
    twitterVisible: profile.twitterVisible,
    github: profile.github || "",
    githubVisible: profile.githubVisible,
    linkedin: profile.linkedin || "",
    linkedinVisible: profile.linkedinVisible,
    phone: profile.phone || "",
    phoneVisible: profile.phoneVisible,
    avatar: profile.avatar || "",
    avatarVisible: profile.avatarVisible,
    tagline: profile.tagline || "",
    taglineVisible: profile.taglineVisible,
  };
}

export function AdminProfilePanel({ currentUser }: { currentUser: SafeUser }) {
  const [form, setForm] = useState<ProfileForm>(defaultProfileForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      setErrorMsg("");
      try {
        const profile = await getMyProfile();
        if (mounted) setForm(profileToForm(profile));
      } catch (error: any) {
        if (mounted) setErrorMsg(error.message || "Unable to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const update = (key: keyof ProfileForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggle = (key: keyof ProfileForm) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMsg("");
    try {
      const result = await updateMyProfile(form);
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setForm(profileToForm(result.profile as AuthorProfile));
        setMessage("Profile saved to database.");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarUploading(true);
    setMessage("");
    setErrorMsg("");
    const payload = new FormData();
    payload.append("file", file);

    try {
      const response = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();
      if (!response.ok || result.error || !result.media?.url) {
        setErrorMsg(result.error || "Unable to upload avatar.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        avatar: result.media.url,
        avatarVisible: true,
      }));
      setMessage("Profile image uploaded and saved to database.");
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return <div className="nexus-card p-6 text-xs font-bold nexus-text-muted">Loading profile editor...</div>;
  }

  return (
    <form onSubmit={saveProfile} className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <Card className="xl:col-span-4 overflow-hidden">
        <CardHeader>
          <CardTitle>Profile Preview</CardTitle>
          <p className="mt-1 text-xs nexus-text-muted">This profile powers the public author page and story-card hover popup.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center text-center">
            {form.avatar ? (
              <img src={form.avatar} alt={currentUser.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-950/50" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[var(--grad-primary)] text-white flex items-center justify-center text-2xl font-black">
                {initials(currentUser.name)}
              </div>
            )}
            <h2 className="mt-4 text-xl font-black text-[var(--nexus-text-main)]">{currentUser.name}</h2>
            <p className="mt-1 text-xs nexus-text-muted">{currentUser.email}</p>
            {form.tagline && <p className="mt-3 text-sm leading-6 text-[var(--nexus-text-main)]">{form.tagline}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest font-bold nexus-text-muted">Profile Image URL</label>
            <input
              value={form.avatar}
              onChange={(event) => update("avatar", event.target.value)}
              placeholder="/api/media/123 or https://..."
              className="nexus-input w-full px-3.5 py-3 text-xs outline-none"
            />
            <label className={`app-primary-btn inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-all ${avatarUploading ? "pointer-events-none opacity-70" : ""}`}>
              <UploadCloud className="h-4 w-4" />
              <span>{avatarUploading ? "Uploading..." : "Upload Profile Image"}</span>
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarUploading} className="hidden" />
            </label>
          </div>

          <VisibilityButton visible={form.avatarVisible} onClick={() => toggle("avatarVisible")} />
        </CardContent>
      </Card>

      <Card className="xl:col-span-8 overflow-hidden">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <p className="mt-1 text-xs nexus-text-muted">Every field below is saved to the `AuthorProfile` table with its visibility flag.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {message && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-bold text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300">{message}</div>}
          {errorMsg && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{errorMsg}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {profileFields.map((field) => {
              const Icon = field.icon;
              const key = field.key as keyof ProfileForm;
              const visibleKey = `${field.key}Visible` as keyof ProfileForm;
              const visible = Boolean(form[visibleKey]);

              return (
                <div key={field.key} className={field.type === "textarea" ? "lg:col-span-2 space-y-2" : "space-y-2"}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--nexus-text-main)]">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                      {field.label}
                    </label>
                    <VisibilityButton compact visible={visible} onClick={() => toggle(visibleKey)} />
                  </div>

                  {field.type === "textarea" ? (
                    <textarea
                      value={String(form[key] || "")}
                      onChange={(event) => update(key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={5}
                      className="nexus-input w-full resize-y px-3.5 py-3 text-xs leading-6 outline-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={String(form[key] || "")}
                      onChange={(event) => update(key, event.target.value)}
                      placeholder={field.placeholder}
                      className="nexus-input w-full px-3.5 py-3 text-xs outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--nexus-card-border)] pt-5">
            <p className="text-xs nexus-text-muted">Saving updates the database and refreshes public author/story pages.</p>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function VisibilityButton({ visible, onClick, compact = false }: { visible: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
        visible
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
          : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
      } ${compact ? "px-2 py-1 tracking-normal" : ""}`}
    >
      {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {visible ? "Public" : "Private"}
    </button>
  );
}
