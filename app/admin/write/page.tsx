"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  LayoutDashboard,
  Save,
  SearchCheck,
  Sparkles,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Mail,
  Inbox,
  Users,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { getMe, logoutUser } from "@/actions/auth";
import { SafeUser } from "@/types";
import { writeArticle } from "@/actions/admin";
import { renderArticleContent } from "@/lib/markdown";
import { generateSeo, stripHtml } from "@/lib/seo";
import { RichStoryEditor, RichStoryEditorHandle } from "@/components/RichStoryEditor";
import { AdminAnimatedBackground, MotionDiv, MotionForm, MotionPanel, panelMotion } from "@/components/AdminMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminTab = "overview" | "stories" | "google" | "subscribers" | "messages" | "users" | "media" | "ads" | "site" | "mail";

const tabs: Array<{ id: AdminTab; label: string; icon: any; adminOnly?: boolean }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "stories", label: "Stories", icon: BookOpen },
  { id: "google", label: "Google Setup", icon: Gauge, adminOnly: true },
  { id: "subscribers", label: "Subscribers", icon: Mail, adminOnly: true },
  { id: "messages", label: "Messages", icon: Inbox, adminOnly: true },
  { id: "users", label: "Users", icon: Users, adminOnly: true },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "ads", label: "Ads", icon: Megaphone, adminOnly: true },
  { id: "site", label: "Website Content", icon: MessageSquare, adminOnly: true },
  { id: "mail", label: "Mail Setup", icon: Settings, adminOnly: true },
];

// Separate the inner form component to make use of useSearchParams safely inside Suspense
function WriteArticleForm() {
  const searchParams = useSearchParams();
  const editIdText = searchParams?.get("id") || "";
  const editId = editIdText ? parseInt(editIdText) : null;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [twitterImage, setTwitterImage] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [seoScore, setSeoScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const router = useRouter();
  const editorRef = useRef<RichStoryEditorHandle>(null);

  const handleGenerateSeo = () => {
    const seo = generateSeo({
      title,
      excerpt: "", // Force regenerate fresh excerpt from content/title
      content: editorRef.current?.getHTML() || content,
      category,
      coverImage,
      metaTitle: "", // Force regenerate fresh meta title
      metaDescription: "", // Force regenerate fresh meta description
      metaKeywords: "", // Force regenerate fresh meta keywords
      canonicalUrl, // Keep manual canonicalUrl
      ogTitle: "", // Force regenerate
      ogDescription: "", // Force regenerate
      ogImage: "", // Force regenerate
      twitterTitle: "", // Force regenerate
      twitterDescription: "", // Force regenerate
      twitterImage: "", // Force regenerate
      focusKeyword, // Keep focusKeyword
    });

    setExcerpt(seo.excerpt);
    setMetaTitle(seo.metaTitle);
    setMetaDescription(seo.metaDescription);
    setMetaKeywords(seo.metaKeywords);
    setCanonicalUrl(seo.canonicalUrl);
    setOgTitle(seo.ogTitle);
    setOgDescription(seo.ogDescription);
    setOgImage(seo.ogImage);
    setTwitterTitle(seo.twitterTitle);
    setTwitterDescription(seo.twitterDescription);
    setTwitterImage(seo.twitterImage);
    setFocusKeyword(seo.focusKeyword);
    setSeoScore(seo.seoScore);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        setErrorMsg(result.error || "Failed to upload cover file");
      } else {
        setCoverImage(result.media.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload cover file");
    } finally {
      setCoverUploading(false);
    }
  };

  // Load existing article if editing
  useEffect(() => {
    if (!editId) return;
    setIsEditMode(true);
    setLoading(true);

    const loadArticleToEdit = async () => {
      try {
        // Query server actions or API
        const response = await fetch(`/api/articles/get-by-id?id=${editId}`);
        if (response.ok) {
          const res = await response.json();
          if (res.article) {
            setTitle(res.article.title);
            setCategory(res.article.category);
            setCoverImage(res.article.coverImage);
            setExcerpt(res.article.excerpt);
            setContent(res.article.content);
            setPublished(res.article.published);
            setMetaTitle(res.article.metaTitle || "");
            setMetaDescription(res.article.metaDescription || "");
            setMetaKeywords(res.article.metaKeywords || "");
            setCanonicalUrl(res.article.canonicalUrl || "");
            setOgTitle(res.article.ogTitle || "");
            setOgDescription(res.article.ogDescription || "");
            setOgImage(res.article.ogImage || "");
            setTwitterTitle(res.article.twitterTitle || "");
            setTwitterDescription(res.article.twitterDescription || "");
            setTwitterImage(res.article.twitterImage || "");
            setFocusKeyword(res.article.focusKeyword || "");
            setSeoScore(res.article.seoScore || 0);
          }
        } else {
          const res = await response.json();
          setErrorMsg(res.error || "Failed to load article for editing");
        }
      } catch (error) {
        console.error("Error loading article for editing:", error);
      } finally {
        setLoading(false);
      }
    };

    loadArticleToEdit();
  }, [editId]);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentContent = editorRef.current?.getHTML() || content;
    if (!title.trim() || !stripHtml(currentContent).trim()) {
      setErrorMsg("Title and story content are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const payload = {
      ...(editId ? { id: editId } : {}),
      title: title.trim(),
      category: category.trim(),
      coverImage: coverImage.trim(),
      excerpt: excerpt.trim(),
      content: currentContent.trim(),
      published,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      metaKeywords: metaKeywords.trim(),
      canonicalUrl: canonicalUrl.trim(),
      ogTitle: ogTitle.trim(),
      ogDescription: ogDescription.trim(),
      ogImage: ogImage.trim(),
      twitterTitle: twitterTitle.trim(),
      twitterDescription: twitterDescription.trim(),
      twitterImage: twitterImage.trim(),
      focusKeyword: focusKeyword.trim(),
    };

    const res = await writeArticle(payload);
    if ("error" in res) {
      setErrorMsg(res.error || "Failed to preserve publication.");
      setLoading(false);
    } else {
      router.refresh();
      router.push("/admin?tab=stories");
    }
  };

  return (
    <div className="space-y-6">
      {/* Return Navigation */}
      <div>
        <Link
          href="/admin?tab=stories"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-indigo-650 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Admin Command</span>
        </Link>
      </div>

      <MotionPanel {...panelMotion} className="nexus-card relative overflow-hidden p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="border-blue-200/70 bg-blue-50/80 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">Composer Studio</Badge>
          <h1 className="text-2xl font-black text-slate-1000 dark:text-zinc-50 tracking-tight mt-1 mb-0.5">
            {isEditMode ? "Modify Article Publication" : "Write Curated Article"}
          </h1>
          <p className="text-xs text-gray-405">
            Compose visual stories, tune search previews, and publish with complete metadata.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          variant="secondary"
          className="self-start sm:self-center"
        >
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4 text-gray-500" />
              <span>Back to Editor</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-indigo-500" />
              <span>Preview Layout</span>
            </>
          )}
        </Button>
      </MotionPanel>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200 dark:border-rose-900/65 rounded-xl text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {previewMode ? (
        <MotionDiv {...panelMotion} className="grid grid-cols-1 gap-6">
          <Card className="max-w-none p-0 overflow-hidden">
            <CardContent className="p-6 sm:p-10">
            <div className="flex items-center gap-2.5 mb-4">
              <Badge>{category}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-1000 dark:text-zinc-100 tracking-tight leading-tight mb-4">
              {title || <span className="text-gray-200 italic">Untitled Article</span>}
            </h1>
            <p className="border-l-2 border-indigo-200 pl-4 py-0.5 text-xs sm:text-sm text-gray-500 italic mb-8">
              {excerpt || <span className="text-gray-300 italic">No description excerpt provided</span>}
            </p>

            {coverImage && (
              <img
                src={coverImage}
                alt="Banner preview"
                className="w-full h-56 sm:h-80 object-cover rounded-2xl mb-8 border"
              />
            )}

            <div
              className="prose dark:prose-invert text-sm text-slate-705"
              dangerouslySetInnerHTML={{ __html: renderArticleContent(content) }}
            />
            </CardContent>
          </Card>
        </MotionDiv>
      ) : (
        <MotionForm {...panelMotion} onSubmit={handlePublishSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main compilation inputs */}
          <Card className="xl:col-span-8 overflow-hidden">
            <CardHeader>
              <CardTitle>Story Editor</CardTitle>
              <p className="mt-1 text-xs text-gray-500">Edit mode loads the saved body directly into the rich editor.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="block">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Article Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Silent Flow of Minimalist Architecture"
                className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
                required
              />
              </label>

            <div>
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Story Body</span>
              <RichStoryEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
              />
              <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                Use the toolbar to add headings, colors, alignment, lists, quotes, links, uploaded images, embedded videos, and code blocks.
              </p>
            </div>
            </CardContent>
          </Card>

          {/* Right sidebar configuration settings */}
          <Card className="xl:col-span-4 overflow-hidden">
            <CardHeader>
              <CardTitle>Publication Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Catalog Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
              >
                <option value="Stories">Stories</option>
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Life">Life</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Devops">Devops</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Cover Image (URL or Upload)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... or custom path"
                  className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
                />
                
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-gray-200 dark:bg-zinc-900 border-dashed dark:border-zinc-800 hover:bg-slate-105 hover:border-indigo-400 dark:hover:bg-zinc-850 rounded-xl text-[10px] font-bold leading-none cursor-pointer text-gray-600 dark:text-zinc-350 transition-colors">
                    <UploadCloud className="h-4 w-4 text-indigo-500 mr-1.5" />
                    <span>{coverUploading ? "Uploading Cover..." : "Upload Cover Image File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={coverUploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Short Excerpt Summary</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Briefly state what this publication is about..."
                rows={3}
                className="nexus-input w-full text-xs p-3 outline-none"
              />
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-900 pt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-widest font-mono">SEO Studio</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Auto-fill fields, then adjust anything manually.</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 flex items-center justify-center text-xs font-black text-indigo-650">
                  {seoScore}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateSeo}
                className="app-primary-btn w-full h-11 active:scale-[0.98] transition-all rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer border-0 outline-none"
              >
                <SearchCheck className="h-4 w-4" />
                <span>Auto Generate SEO</span>
              </button>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Focus Keyword</label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="primary search phrase"
                  className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
                  placeholder="Search result title"
                  className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
                />
                <span className="mt-1 block text-[10px] text-gray-400">{metaTitle.length}/65 ideal</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  maxLength={180}
                  placeholder="Search result description"
                  className="nexus-input w-full text-xs p-3 outline-none"
                />
                <span className="mt-1 block text-[10px] text-gray-400">{metaDescription.length}/160 ideal</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Keywords</label>
                <textarea
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  rows={2}
                  placeholder="keyword one, keyword two, keyword three"
                  className="nexus-input w-full text-xs p-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">Canonical URL</label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/original-story"
                  className="nexus-input w-full text-xs px-3.5 py-3 outline-none"
                />
                <p className="mt-1 text-[10px] text-gray-400 leading-relaxed">
                  Leave empty for new stories. The site automatically uses this story&apos;s own URL. Only fill this if the original story already exists on another website.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Open Graph title"
                  className="w-full text-xs px-3.5 py-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  rows={2}
                  placeholder="Open Graph description"
                  className="w-full text-xs p-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Open Graph image URL"
                  className="w-full text-xs px-3.5 py-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={twitterTitle}
                  onChange={(e) => setTwitterTitle(e.target.value)}
                  placeholder="Twitter/X title"
                  className="w-full text-xs px-3.5 py-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
                <textarea
                  value={twitterDescription}
                  onChange={(e) => setTwitterDescription(e.target.value)}
                  rows={2}
                  placeholder="Twitter/X description"
                  className="w-full text-xs p-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
                <input
                  type="text"
                  value={twitterImage}
                  onChange={(e) => setTwitterImage(e.target.value)}
                  placeholder="Twitter/X image URL"
                  className="w-full text-xs px-3.5 py-3 outline-none rounded-xl border border-gray-200 bg-transparent focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-zinc-810 dark:bg-zinc-950"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 select-none border-t border-gray-100 dark:border-zinc-900 pt-4">
              <input
                type="checkbox"
                id="published-toggle"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 text-indigo-650"
              />
              <label htmlFor="published-toggle" className="text-xs font-bold text-gray-600 dark:text-zinc-350 cursor-pointer">Published Active (Live on Catalog)</label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Preserving..." : isEditMode ? "Update Publication" : "Publish Article"}</span>
            </Button>
            </CardContent>
          </Card>
        </MotionForm>
      )}
    </div>
  );
}

export default function WritePage() {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRolePrivilege = async () => {
      setLoading(true);
      const u = await getMe();
      setCurrentUser(u);
      if (u && !u.isBanned && (u.role === "ADMIN" || u.role === "AUTHOR")) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    };
    checkRolePrivilege();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650 mx-auto" />
          <p className="text-xs text-gray-500 mt-3 font-mono">Authenticating credentials...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <AdminComposerShell currentUser={currentUser}>
        <div className="max-w-md mx-auto py-20 text-center">
          <h2 className="text-lg font-black text-slate-1000 dark:text-zinc-150 tracking-tight">Access Prohibited</h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            You lack editorial status required to write. Please log in with a supervisor authorization account.
          </p>
          <Link
            href="/login"
            className="app-primary-btn inline-block mt-6 px-4 py-2 rounded-xl text-xs font-bold leading-none"
          >
            Sign In
          </Link>
        </div>
      </AdminComposerShell>
    );
  }

  return (
    <AdminComposerShell currentUser={currentUser}>
      <Suspense fallback={<p className="text-center py-2 text-xs font-mono">Loading composer hook...</p>}>
        <WriteArticleForm />
      </Suspense>
    </AdminComposerShell>
  );
}

function AdminComposerShell({ children, currentUser }: { children: React.ReactNode; currentUser: SafeUser | null }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  const nav = (
    <aside className={`admin-sidebar ${sidebarCollapsed ? "lg:w-20" : "lg:w-60"} h-full flex flex-col transition-all duration-300 backdrop-blur-2xl`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--nexus-card-border)]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white inline-flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/20">A</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--nexus-text-muted)] font-bold">ArticleDestiny</p>
              <h2 className="text-sm font-black text-[var(--nexus-text-main)]">Admin Console</h2>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 border border-[var(--nexus-card-border)] text-[var(--nexus-text-main)] transition-colors"
          aria-label="Collapse sidebar"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 border border-[var(--nexus-card-border)] text-[var(--nexus-text-main)] transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                router.push(`/admin?tab=${tab.id}`);
                setMobileSidebarOpen(false);
              }}
              title={tab.label}
              className={`w-full h-10 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start gap-3 px-3"} rounded-lg text-[13px] font-semibold transition-all text-[var(--nexus-text-muted)] hover:bg-slate-900/5 dark:hover:bg-white/[0.035] hover:text-[var(--nexus-text-main)]`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          );
        })}
        <Link
          href="/admin/write"
          className={`h-10 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start gap-3 px-3"} rounded-lg text-[13px] font-semibold bg-[var(--sidebar-active-bg)] text-[var(--nexus-text-main)] border-l-[3px] border-blue-500`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Story Composer</span>}
        </Link>
      </nav>

      {!sidebarCollapsed && currentUser && (
        <div className="p-4 border-t border-[var(--nexus-card-border)]">
          <p className="text-xs font-bold truncate text-[var(--nexus-text-main)]">{currentUser.name}</p>
          <p className="text-[10px] text-[var(--nexus-text-muted)] truncate">{currentUser.email}</p>
        </div>
      )}
    </aside>
  );

  return (
    <div className="admin-shell min-h-screen w-full relative overflow-hidden flex">
      <AdminAnimatedBackground />
      <div className="hidden lg:block sticky top-0 h-screen">{nav}</div>
      {mobileSidebarOpen && <div className="fixed inset-0 z-50 lg:hidden flex"><div className="w-80 max-w-[85vw]">{nav}</div><button className="flex-1 bg-black/40" onClick={() => setMobileSidebarOpen(false)} aria-label="Close menu" /></div>}

      <main className={`flex-1 min-w-0 relative transition-all duration-300 admin-content ${sidebarCollapsed ? "admin-content-collapsed" : "admin-content-expanded"}`}>
        <header className={`admin-header sticky top-0 z-30 backdrop-blur-2xl transition-all duration-300 ${sidebarCollapsed ? "admin-header-collapsed" : "admin-header-expanded"}`}>
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setMobileSidebarOpen(true)} className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-black truncate text-slate-900 dark:text-white">Story Composer</h1>
                <p className="text-[11px] nexus-text-muted truncate">Create, edit, optimize, and publish stories from the admin workspace.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/admin?tab=stories")} className="shrink-0">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await logoutUser();
                  router.refresh();
                  router.push("/");
                }}
                className="shrink-0 flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        <MotionDiv {...panelMotion} className="p-4 sm:p-5 xl:p-6">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </MotionDiv>
      </main>
    </div>
  );
}

