"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Globe,
  MapPin,
  Phone,
  FileText,
  User,
  Sparkles,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { getMe } from "@/actions/auth";
import { getMyProfile, updateMyProfile } from "@/actions/profile";
import { SafeUser, AuthorProfile } from "@/types";

interface ProfileField {
  key: string;
  label: string;
  icon: any;
  type: "text" | "textarea" | "url" | "tel";
  placeholder: string;
  visibleKey: string;
}

const PROFILE_FIELDS: ProfileField[] = [
  { key: "tagline", label: "Tagline", icon: Sparkles, type: "text", placeholder: "e.g. Full-Stack Developer & Writer", visibleKey: "taglineVisible" },
  { key: "bio", label: "Bio", icon: FileText, type: "textarea", placeholder: "Tell readers about yourself, your expertise, and your passions...", visibleKey: "bioVisible" },
  { key: "location", label: "Location", icon: MapPin, type: "text", placeholder: "e.g. Kathmandu, Nepal", visibleKey: "locationVisible" },
  { key: "website", label: "Website", icon: Globe, type: "url", placeholder: "https://yoursite.com", visibleKey: "websiteVisible" },
  { key: "twitter", label: "Twitter / X", icon: Globe, type: "text", placeholder: "e.g. @yourusername", visibleKey: "twitterVisible" },
  { key: "github", label: "GitHub", icon: Globe, type: "text", placeholder: "e.g. yourusername", visibleKey: "githubVisible" },
  { key: "linkedin", label: "LinkedIn", icon: Globe, type: "url", placeholder: "https://linkedin.com/in/yourusername", visibleKey: "linkedinVisible" },
  { key: "phone", label: "Phone", icon: Phone, type: "tel", placeholder: "+977-98XXXXXXXX", visibleKey: "phoneVisible" },
];

export default function AuthorProfileEditPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState<Record<string, any>>({
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
  });

  useEffect(() => {
    async function load() {
      try {
        const me = await getMe();
        setCurrentUser(me);

        if (me) {
          const profile = await getMyProfile();
          if (profile) {
            setFormData({
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
            });
          }
        }
      } catch (err) {
        setErrorMsg("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMsg("");

    try {
      const result = await updateMyProfile(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setMessage("Profile saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarUploading(true);
    setMessage("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/profile/avatar/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || result.error || !result.media?.url) {
        setErrorMsg(result.error || "Failed to upload profile image.");
        return;
      }

      setFormData((prev: Record<string, any>) => ({
        ...prev,
        avatar: result.media.url,
        avatarVisible: true,
      }));
      setMessage("Profile image uploaded. Save your profile to publish it.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload profile image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleVisibility = (visibleKey: string) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [visibleKey]: !prev[visibleKey],
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3 font-mono">Loading profile editor...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black">Sign In Required</h2>
        <p className="text-xs text-gray-500 mt-2">You must be logged in to edit your profile.</p>
        <Link
          href="/login"
          className="app-primary-btn inline-block mt-6 px-4 py-2 rounded-xl text-xs font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/author/${currentUser.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-650 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>View Public Profile</span>
        </Link>
      </div>

      {/* Header card */}
      <div className="relative overflow-hidden bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-2 bg-[var(--grad-primary)]" />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar preview */}
          <div className="relative group">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt={currentUser.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-950 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-900/50"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[var(--grad-primary)] text-white flex items-center justify-center text-2xl font-black uppercase shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-900/50">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2 min-w-0">
            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
              Profile Editor
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-tight break-words">
              {currentUser.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400 break-all sm:break-normal">
              {currentUser.email} - {currentUser.role.toLowerCase()} account
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-800 px-4 py-3 text-xs font-bold text-teal-700 dark:text-teal-300 animate-fade-in">
          Saved: {message}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar image */}
        <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-widest font-mono">
              Avatar Image
            </h3>
            <button
              type="button"
              onClick={() => toggleVisibility("avatarVisible")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                formData.avatarVisible
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
              }`}
            >
              {formData.avatarVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {formData.avatarVisible ? "Public" : "Private"}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://example.com/your-photo.jpg or uploaded image URL"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-sm outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors"
            />
            <label className={`app-primary-btn inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${avatarUploading ? "pointer-events-none opacity-70" : ""}`}>
              <UploadCloud className="h-4 w-4" />
              <span>{avatarUploading ? "Uploading..." : "Upload Image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">
            Upload a JPG, PNG, WebP, or GIF up to 5 MB, or paste an external image URL.
          </p>
        </div>

        {/* Dynamic profile fields */}
        <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-widest font-mono border-b border-gray-100 dark:border-zinc-900 pb-3">
            Profile Information
          </h3>

          <div className="grid grid-cols-1 gap-6">
            {PROFILE_FIELDS.map((field) => {
              const Icon = field.icon;
              const isVisible = formData[field.visibleKey];

              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-zinc-400">
                      <Icon className="h-3.5 w-3.5 text-indigo-500" />
                      {field.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(field.visibleKey)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isVisible
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                    >
                      {isVisible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {isVisible ? "Public" : "Private"}
                    </button>
                  </div>

                  {field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-sm outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-sm outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-colors"
                    />
                  )}

                  {!isVisible && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      This field is hidden from public visitors
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/author/${currentUser.id}`}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="app-primary-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
