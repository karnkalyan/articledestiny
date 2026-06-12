"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings,
  ShieldAlert,
  Tags,
  Trash2,
  Users,
  X,
  Gauge,
  LogOut,
  User,
} from "lucide-react";
import { getMe, logoutUser } from "@/actions/auth";
import { renderArticleContent } from "@/lib/markdown";
import {
  createUserFromAdmin,
  deleteArticle,
  deleteMedia,
  deleteSubscriber,
  getAdsForAdmin,
  getAdminStats,
  getArticlesForAdmin,
  getContactMessagesForAdmin,
  getMediaForAdmin,
  getSiteSettingsForAdmin,
  getSubscribersForAdmin,
  getUsersForAdmin,
  handleUserRoleOrBan,
  saveAd,
  saveCatalogCategories,
  saveSiteSettings,
  sendTestEmail,
  updateContactMessageStatus,
} from "@/actions/admin";
import { Ad, Article, ContactMessage, SafeUser, Subscriber } from "@/types";
import { AdminAnimatedBackground, MotionDiv, MotionForm, MotionPanel, listMotion, panelMotion, rowMotion } from "@/components/AdminMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input as ShadInput } from "@/components/ui/input";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { RichStoryEditor } from "@/components/RichStoryEditor";
import { AdminProfilePanel } from "@/components/AdminProfilePanel";

type AdminTab = "overview" | "stories" | "categories" | "profile" | "google" | "subscribers" | "messages" | "users" | "media" | "ads" | "site" | "mail";

const tabs: Array<{ id: AdminTab; label: string; icon: any; adminOnly?: boolean }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "stories", label: "Stories", icon: BookOpen },
  { id: "categories", label: "Categories", icon: Tags, adminOnly: true },
  { id: "profile", label: "My Profile", icon: User },
  { id: "google", label: "Google Setup", icon: Gauge, adminOnly: true },
  { id: "subscribers", label: "Subscribers", icon: Mail, adminOnly: true },
  { id: "messages", label: "Messages", icon: Inbox, adminOnly: true },
  { id: "users", label: "Users", icon: Users, adminOnly: true },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "ads", label: "Ads", icon: Megaphone, adminOnly: true },
  { id: "site", label: "Website Content", icon: MessageSquare, adminOnly: true },
  { id: "mail", label: "Mail Setup", icon: Settings, adminOnly: true },
];

const emptySettings = {
  about_eyebrow: "Editorial Manifesto",
  about_title: "Where technology intersects human curiosity.",
  about_intro: "ArticleDestiny is a boutique publishing engine curated to inspire and inform developers, digital designers, and tech enthusiasts.",
  about_feature_one_title: "Curated Exploration",
  about_feature_one_body: "Thoughtful stories, clean publishing, and a reading experience built for attention.",
  about_feature_two_title: "Privacy First Ecosystem",
  about_feature_two_body: "Reader history stays local or securely tied to authenticated accounts.",
  about_body: "<p>Established in 2026, ArticleDestiny grew from a single developer's dissatisfaction with algorithmic content feeds. Recognizing the beauty in focused, long-form technical literature, we developed an application with an unyielding dedication to visual rhythm and structural clarity.</p><p>We hope our platform inspires you to think deeply, experiment creatively, and contribute constructively to the active dialogue thread below each article on our server.</p>",
  privacy_title: "Privacy Policy",
  privacy_body: "<h2>1. Information We Collect</h2><p>We value your privacy. Your reading history stays local to your browser session using localStorage unless you choose to authenticate. If you create an account, we store your name, email address, profile settings, and interactions (such as likes and comments) to personalize your experience.</p><h2>2. Data Usage & Security</h2><p>Your details are never sold, rented, or distributed to third-party marketing entities. We strictly use configuration emails to notify you of subscriptions, newsletters, or replies to comments.</p><h2>3. Cookies and Tracking</h2><p>We use essential cookies to maintain user authentication sessions. Third-party services like Google Analytics and Google AdSense may collect standard device indicators and usage statistics if enabled by the site administration.</p>",
  contact_eyebrow: "Get in Touch",
  contact_title: "Connect with ArticleDestiny",
  contact_description: "Suggestions, submissions, editorial pitches, or general design reviews.",
  mail_host: "",
  mail_port: "587",
  mail_user: "",
  mail_pass: "",
  mail_from: "",
  mail_secure: "false",
  site_url: "https://articledestiny.com",
  google_search_console_verification: "",
  ga4_measurement_id: "",
  adsense_client_id: "",
  adsense_auto_ads: "true",
  google_client_id: "",
  google_client_secret: "",
  site_title: "",
  site_description: "",
  site_keywords: "",
  site_og_image: "",
  site_twitter_handle: "",
  catalog_categories: "[]",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [query, setQuery] = useState("");

  const [stats, setStats] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>(emptySettings);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", role: "USER", password: "user123_temp" });
  const [aboutFeatures, setAboutFeatures] = useState<Array<{ title: string; body: string }>>([]);
  const [newCategory, setNewCategory] = useState("");
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [sitePreviewTab, setSitePreviewTab] = useState<"about" | "privacy" | "contact">("about");

  // Sync settings when loaded
  useEffect(() => {
    if (settings.about_features) {
      try {
        setAboutFeatures(JSON.parse(settings.about_features));
      } catch (_) {
        setAboutFeatures([]);
      }
    } else {
      setAboutFeatures([
        { title: settings.about_feature_one_title || "Curated Exploration", body: settings.about_feature_one_body || "Thoughtful stories, clean publishing, and a reading experience built for attention." },
        { title: settings.about_feature_two_title || "Privacy First Ecosystem", body: settings.about_feature_two_body || "Reader history stays local or securely tied to authenticated accounts." }
      ]);
    }
  }, [settings]);

  const updateFeature = (index: number, key: "title" | "body", val: string) => {
    const updated = [...aboutFeatures];
    updated[index][key] = val;
    setAboutFeatures(updated);
    setSettings({ ...settings, about_features: JSON.stringify(updated) });
  };

  const addFeature = () => {
    const updated = [...aboutFeatures, { title: "New Feature", body: "Description of the new feature." }];
    setAboutFeatures(updated);
    setSettings({ ...settings, about_features: JSON.stringify(updated) });
  };

  const removeFeature = (index: number) => {
    const updated = aboutFeatures.filter((_, i) => i !== index);
    setAboutFeatures(updated);
    setSettings({ ...settings, about_features: JSON.stringify(updated) });
  };

  const addCatalogCategory = () => {
    const next = newCategory.trim();
    if (!next) return;
    const updated = Array.from(new Set([...catalogCategories, next]));
    setSettings({ ...settings, catalog_categories: JSON.stringify(updated) });
    setNewCategory("");
  };

  const removeCatalogCategory = (category: string) => {
    const updated = catalogCategories.filter((item) => item !== category);
    setSettings({ ...settings, catalog_categories: JSON.stringify(updated) });
  };

  const generateSiteSeoContent = () => {
    const siteUrl = (settings.site_url || "https://articledestiny.com").replace(/\/+$/, "");
    setSettings({
      ...settings,
      site_title: "ArticleDestiny - Stories, Ideas, and Developer Insights",
      site_description: "Read thoughtful ArticleDestiny stories about technology, design, life, creativity, and developer ideas written for curious readers.",
      site_keywords: "ArticleDestiny, technology stories, developer stories, design articles, life essays, creative writing, productivity, web development",
      site_og_image: settings.site_og_image || `${siteUrl}/logo/mainlogo.png`,
      site_twitter_handle: settings.site_twitter_handle || "@articledestiny",
    });
  };

  const copyMediaUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage(`Copied ${url}`);
      setErrorMsg("");
    } catch (_) {
      setErrorMsg("Unable to copy media URL. Select and copy the URL manually.");
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const authorized = !!currentUser && !currentUser.isBanned && (currentUser.role === "ADMIN" || currentUser.role === "AUTHOR");

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);
  const unreadMessages = messages.filter((item) => item.status === "NEW").length;
  const filteredArticles = useMemo(() => {
    const q = query.toLowerCase();
    return articles.filter((article) => `${article.title} ${article.category} ${article.slug}`.toLowerCase().includes(q));
  }, [articles, query]);
  const catalogCategories = useMemo(() => {
    try {
      const parsed = JSON.parse(settings.catalog_categories || "[]");
      if (Array.isArray(parsed)) return Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)));
    } catch (_) {
      return (settings.catalog_categories || "").split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }, [settings.catalog_categories]);

  async function refresh() {
    setLoading(true);
    setErrorMsg("");
    try {
      const me = await getMe();
      setCurrentUser(me);
      if (!me || me.isBanned || (me.role !== "ADMIN" && me.role !== "AUTHOR")) return;

      const [nextStats, nextArticles, nextMedia] = await Promise.all([
        getAdminStats(),
        getArticlesForAdmin(),
        getMediaForAdmin(),
      ]);
      setStats(nextStats);
      setArticles(nextArticles);
      setMediaList(nextMedia);

      if (me.role === "ADMIN") {
        const [nextUsers, nextSubscribers, nextMessages, nextAds, nextSettings] = await Promise.all([
          getUsersForAdmin(),
          getSubscribersForAdmin(),
          getContactMessagesForAdmin(),
          getAdsForAdmin(),
          getSiteSettingsForAdmin(),
        ]);
        setUsers(nextUsers);
        setSubscribers(nextSubscribers as Subscriber[]);
        setMessages(nextMessages as ContactMessage[]);
        setAds(nextAds);
        setSettings({ ...emptySettings, ...nextSettings });
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to load admin panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as AdminTab;
      if (tabParam && tabs.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
    refresh();
  }, []);

  const runAction = async (action: () => Promise<any>, success: string) => {
    setMessage("");
    setErrorMsg("");
    try {
      const result = await action();
      if (result?.error) setErrorMsg(result.error);
      else {
        setMessage(success);
        await refresh();
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Action failed.");
    }
  };

  const nav = (
    <aside className={`admin-sidebar ${sidebarCollapsed ? "lg:w-20" : "lg:w-60"} h-full flex flex-col transition-all duration-300 backdrop-blur-2xl`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--nexus-card-border)]">
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <img
            src="/logo/logo.png"
            alt="ArticleDestiny"
            className="h-8 w-8 rounded-lg object-contain shadow-lg shadow-blue-500/20"
          />
          {!sidebarCollapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--nexus-text-muted)] font-bold">ArticleDestiny</p>
              <h2 className="text-sm font-black text-[var(--nexus-text-main)]">Admin Console</h2>
            </div>
          )}
        </div>
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
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab.id);
                  window.history.pushState({}, "", url.toString());
                }
              }}
              title={tab.label}
              className={`w-full h-10 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-start gap-3 px-3"} rounded-lg text-[13px] font-semibold transition-all ${
                active ? "bg-[var(--sidebar-active-bg)] text-[var(--nexus-text-main)] border-l-[3px] border-blue-500" : "text-[var(--nexus-text-muted)] hover:bg-slate-900/5 dark:hover:bg-white/[0.035] hover:text-[var(--nexus-text-main)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {!sidebarCollapsed && currentUser && (
        <div className="p-4 border-t border-[var(--nexus-card-border)]">
          <p className="text-xs font-bold truncate text-[var(--nexus-text-main)]">{currentUser.name}</p>
          <p className="text-[10px] text-[var(--nexus-text-muted)] truncate">{currentUser.email}</p>
        </div>
      )}
    </aside>
  );

  if (loading && !currentUser) {
    return <div className="py-20 text-center text-xs text-gray-500 font-mono">Loading admin console...</div>;
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black">Access Prohibited</h2>
        <p className="text-xs text-gray-500 mt-2">Please sign in with an admin or author account.</p>
        <Link href="/login" className="app-primary-btn inline-block mt-6 px-4 py-2 rounded-xl text-xs font-bold">Sign In</Link>
      </div>
    );
  }

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
                <h1 className="text-lg font-black truncate text-slate-900 dark:text-white">Admin Panel</h1>
                <p className="text-[11px] nexus-text-muted truncate">Professional control center for stories, SEO, mail, ads, and website content.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/admin/write")} className="shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Story</span>
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

        <MotionDiv {...panelMotion} className="relative p-4 sm:p-5 xl:p-6 space-y-5">
          {message && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-bold text-teal-700">{message}</div>}
          {errorMsg && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{errorMsg}</div>}

          {activeTab === "overview" && stats && (
            <MotionPanel {...panelMotion} className="space-y-5">
              <MotionDiv variants={listMotion} initial="initial" animate="animate" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  ["Stories", stats.totalArticles, BookOpen],
                  ["Views", stats.totalViews, BarChart3],
                  ["Subscribers", stats.totalSubscribers, Mail],
                  ["Messages", stats.totalMessages, Inbox],
                ].map(([label, value, Icon]: any) => (
                  <MotionDiv variants={rowMotion} key={label} whileHover={{ y: -2 }} className="nexus-stat-card relative overflow-hidden p-5 flex items-center gap-4">
                    <div className="nexus-stat-icon h-11 w-11 rounded-[10px] text-white flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-tight text-[var(--nexus-text-main)]">{value}</p>
                      <p className="text-xs nexus-text-muted font-medium">{label}</p>
                    </div>
                  </MotionDiv>
                ))}
              </MotionDiv>
            </MotionPanel>
          )}

          {activeTab === "profile" && currentUser && (
            <MotionPanel {...panelMotion}>
              <AdminProfilePanel currentUser={currentUser} />
            </MotionPanel>
          )}

          {activeTab === "google" && (
            <MotionForm {...panelMotion} onSubmit={(e) => { e.preventDefault(); runAction(() => saveSiteSettings(settings), "Google and site settings saved."); }} className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <section className="xl:col-span-7 rounded-3xl bg-white/75 dark:bg-zinc-950/60 border border-white/70 dark:border-white/10 p-5 sm:p-6 shadow-2xl shadow-indigo-200/30 dark:shadow-black/30 backdrop-blur-xl space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-indigo-600">Google Control Room</p>
                  <h2 className="text-xl font-black mt-1">Search Console, Analytics, AdSense & SEO</h2>
                  <p className="text-xs text-gray-500 mt-1">Paste the simple value or the full Google snippet. The app extracts IDs and renders verification tags, Analytics, AdSense, ads.txt, robots, and sitemap URLs automatically.</p>
                </div>
                <Input label="Public Site URL" value={settings.site_url} onChange={(value) => setSettings({ ...settings, site_url: value })} placeholder="https://articledestiny.com" />
                <Input label="Google Search Console Verification" value={settings.google_search_console_verification} onChange={(value) => setSettings({ ...settings, google_search_console_verification: value })} placeholder="verification token or full meta tag" />
                <Input label="GA4 Measurement ID" value={settings.ga4_measurement_id} onChange={(value) => setSettings({ ...settings, ga4_measurement_id: value })} placeholder="G-XXXXXXXXXX or full gtag snippet" />
                <Input label="AdSense Verification / Publisher ID" value={settings.adsense_client_id} onChange={(value) => setSettings({ ...settings, adsense_client_id: value })} placeholder="ca-pub-... or AdSense script/meta/ads.txt line" />
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={settings.adsense_auto_ads !== "false"} onChange={(e) => setSettings({ ...settings, adsense_auto_ads: String(e.target.checked) })} />
                  Load AdSense script globally for Auto Ads
                </label>

                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-black text-indigo-600">Google OAuth Sign-In Settings</p>
                    <p className="text-xs text-gray-500 mt-1">Configure client ID and secret to enable Sign In with Google across the platform.</p>
                  </div>
                  <Input label="Google Client ID" value={settings.google_client_id} onChange={(value) => setSettings({ ...settings, google_client_id: value })} placeholder="Google client ID" />
                  <Input label="Google Client Secret" type="password" value={settings.google_client_secret} onChange={(value) => setSettings({ ...settings, google_client_secret: value })} placeholder="Google client secret" />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-black text-indigo-600">Site-Level SEO</p>
                    <p className="text-xs text-gray-500 mt-1">These values are used as the global metadata for every page on the site. Leave blank to use defaults.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={generateSiteSeoContent} className="w-fit">
                    <Plus className="h-4 w-4" /> Generate Auto SEO Content
                  </Button>
                  <Input label="Site Title" value={settings.site_title} onChange={(value) => setSettings({ ...settings, site_title: value })} placeholder="ArticleDestiny - Tech, Design, and Developer Stories" />
                  <Textarea label="Site Description" value={settings.site_description} onChange={(value) => setSettings({ ...settings, site_description: value })} rows={2} />
                  <Input label="Site Keywords (comma-separated)" value={settings.site_keywords} onChange={(value) => setSettings({ ...settings, site_keywords: value })} placeholder="technology, developer, stories, design" />
                  <Input label="Default OG Image URL" value={settings.site_og_image} onChange={(value) => setSettings({ ...settings, site_og_image: value })} placeholder="https://articledestiny.com/og-default.jpg" />
                  <Input label="Twitter Handle" value={settings.site_twitter_handle} onChange={(value) => setSettings({ ...settings, site_twitter_handle: value })} placeholder="@articledestiny" />
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4" /> Save Google & SEO Setup
                </Button>
              </section>

              <section className="xl:col-span-5 rounded-3xl bg-slate-950 text-white border border-white/10 p-5 sm:p-6 shadow-2xl shadow-slate-900/30 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest">What These Fields Do</h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p><strong className="text-white">Search Console:</strong> paste the token or full meta tag. The app renders the required meta tag.</p>
                  <p><strong className="text-white">Sitemap:</strong> generated live at <span className="text-blue-300">{(settings.site_url || "http://localhost:3400").replace(/\/+$/, "")}/sitemap.xml</span>.</p>
                  <p><strong className="text-white">GA4:</strong> use an ID like <span className="text-blue-300">G-XXXXXXXXXX</span>. The tracking script loads automatically.</p>
                  <p><strong className="text-white">AdSense:</strong> use an ID like <span className="text-blue-300">ca-pub-XXXXXXXXXXXXXXXX</span>, or paste the script, meta tag, or ads.txt line. The app renders all three verification methods.</p>
                  <p><strong className="text-white">Site Title & Description:</strong> used as the default meta title and description on all pages. Overridden per-article by article-level SEO fields.</p>
                  <p><strong className="text-white">Site Keywords:</strong> comma-separated keywords for global site SEO meta tags.</p>
                  <p><strong className="text-white">Default OG Image:</strong> fallback image for social sharing when articles don't specify one.</p>
                </div>
              </section>
            </MotionForm>
          )}

          {activeTab === "stories" && (
            <MotionPanel {...panelMotion} className="nexus-card overflow-hidden">
              <div className="nexus-card-header flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <h2 className="nexus-card-title">Stories</h2>
                <div className="relative sm:w-72">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nexus-text-muted)]" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stories" className="nexus-input w-full pl-9 pr-3 py-2 text-xs outline-none" />
                </div>
              </div>
              <MotionDiv variants={listMotion} initial="initial" animate="animate">
                {filteredArticles.map((article) => (
                  <MotionDiv variants={rowMotion} key={article.id} className="nexus-row p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">{article.category}</span>
                        <span className="text-[10px] nexus-text-muted">SEO {article.seoScore}/100</span>
                      </div>
                      <h3 className="font-bold truncate">{article.title}</h3>
                      <p className="text-[10px] nexus-text-muted truncate">/{article.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setPreviewArticle(article)} className="h-8 px-3">Preview</Button>
                      <Button onClick={() => router.push(`/admin/write?id=${article.id}`)} className="h-8 px-3">Edit</Button>
                      <Button variant="destructive" onClick={() => runAction(() => deleteArticle(article.id), "Story deleted.")} className="h-8 px-3 gap-1.5"><Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Delete</span></Button>
                    </div>
                  </MotionDiv>
                ))}
              </MotionDiv>
            </MotionPanel>
          )}

          {activeTab === "categories" && (
            <MotionPanel {...panelMotion} className="nexus-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="nexus-card-title">Categories</h2>
                  <p className="mt-1 text-xs nexus-text-muted">Create the catalog categories used on the homepage and in the story composer.</p>
                </div>
                <Badge className="w-fit border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">{catalogCategories.length} active</Badge>
              </div>

              <div className="rounded-2xl border border-[var(--nexus-card-border)] bg-white/55 p-4 dark:bg-white/[0.02]">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ShadInput
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCatalogCategory();
                      }
                    }}
                    placeholder="New category name"
                  />
                  <Button type="button" onClick={addCatalogCategory} className="shrink-0">
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {catalogCategories.length === 0 && (
                    <p className="text-xs nexus-text-muted">No categories saved yet. Run the seed or add your first category here.</p>
                  )}
                  {catalogCategories.map((category) => (
                    <span key={category} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCatalogCategory(category)}
                        className="rounded-full text-blue-500 hover:text-rose-500"
                        aria-label={`Remove ${category}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button type="button" onClick={() => runAction(() => saveCatalogCategories(catalogCategories), "Categories saved.")} className="w-fit">
                <Save className="h-4 w-4" /> Save Categories
              </Button>
            </MotionPanel>
          )}

          {activeTab === "subscribers" && (
            <DataPanel title={`Subscribers (${subscribers.length})`}>
              {subscribers.length === 0 && (
                <div className="p-6 text-sm text-[var(--nexus-text-muted)]">No subscribers yet.</div>
              )}
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="p-4 border-b border-[var(--nexus-card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold truncate text-[var(--nexus-text-main)]">{subscriber.email}</p>
                    <p className="text-[11px] text-[var(--nexus-text-muted)] truncate">{new Date(subscriber.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={subscriber.active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-gray-500/20 bg-gray-500/10 text-gray-600 dark:text-gray-400"}>{subscriber.active ? "Active" : "Inactive"}</Badge>
                    <Button variant="destructive" onClick={() => runAction(() => deleteSubscriber(subscriber.id), "Subscriber removed.")} className="h-8 px-3 gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </DataPanel>
          )}

          {activeTab === "messages" && (
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Contact Requests</CardTitle>
                  <p className="mt-1 text-xs nexus-text-muted">Every public contact form request appears here.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">{messages.length} total</Badge>
                  <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">{unreadMessages} new</Badge>
                </div>
              </CardHeader>
              <div>
              {messages.length === 0 && (
                <div className="p-6 text-sm nexus-text-muted">No contact requests yet.</div>
              )}
              {messages.map((item) => (
                <div key={item.id} className="nexus-row p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{item.subject}</p>
                      <p className="text-[11px] text-gray-500">{item.name} · {item.email} · {new Date(item.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-2 max-w-3xl">{item.message}</p>
                    </div>
                    <Button onClick={() => runAction(() => updateContactMessageStatus(item.id, item.status === "NEW" ? "READ" : "NEW"), "Message status updated.")} className="h-8 px-3">Mark {item.status === "NEW" ? "Read" : "New"}</Button>
                  </div>
                </div>
              ))}
              </div>
            </Card>
          )}

          {activeTab === "users" && (
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Create User</CardTitle>
                  <p className="mt-1 text-xs nexus-text-muted">Add authors, admins, or regular readers from the console.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); runAction(() => createUserFromAdmin(newUserForm), "User created."); }} className="space-y-3">
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest font-bold nexus-text-muted mb-1">Name</span>
                      <input value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} placeholder="Full name" className="nexus-input w-full px-3 py-2 text-xs outline-none" required />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest font-bold nexus-text-muted mb-1">Email</span>
                      <input type="email" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} placeholder="name@example.com" className="nexus-input w-full px-3 py-2 text-xs outline-none" required />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest font-bold nexus-text-muted mb-1">Password</span>
                      <input type="password" value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} placeholder="Temporary password" className="nexus-input w-full px-3 py-2 text-xs outline-none" required />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-widest font-bold nexus-text-muted mb-1">Role</span>
                      <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className="nexus-input w-full px-3 py-2 text-xs outline-none">
                        <option value="USER">USER</option><option value="AUTHOR">AUTHOR</option><option value="ADMIN">ADMIN</option>
                      </select>
                    </label>
                    <Button type="submit" className="w-full">Create User</Button>
                  </form>
                </CardContent>
              </Card>
              <div className="xl:col-span-2">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Users</CardTitle>
                      <p className="mt-1 text-xs nexus-text-muted">{users.length} registered account{users.length === 1 ? "" : "s"}</p>
                    </div>
                    <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">Access Control</Badge>
                  </CardHeader>
                  <div>
                    {users.map((user) => (
                      <div key={user.id} className="p-4 border-b border-[var(--nexus-card-border)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #4338ca)' }}>
                              {user.name?.slice(0, 1).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate text-[var(--nexus-text-main)]">{user.name}</p>
                              <p className="text-[11px] text-[var(--nexus-text-muted)] truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">{user.role}</Badge>
                            <Badge className={user.isBanned ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}>{user.isBanned ? "Banned" : "Active"}</Badge>
                            <Button variant="outline" onClick={() => router.push(`/author/${user.id}`)} className="h-8 px-3">View Profile</Button>
                            <Button variant="outline" disabled={user.id === currentUser?.id} onClick={() => runAction(() => handleUserRoleOrBan(user.id, String(user.role), user.isBanned, "role"), "Role updated.")} className="h-8 px-3">Change Role</Button>
                            <Button variant="destructive" disabled={user.id === currentUser?.id} onClick={() => runAction(() => handleUserRoleOrBan(user.id, String(user.role), user.isBanned, "ban"), "Ban status updated.")} className="h-8 px-3">{user.isBanned ? "Unban" : "Ban"}</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          )}

          {activeTab === "media" && (
            <section className="nexus-card p-5">
              <h2 className="nexus-card-title mb-4">Media Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {mediaList.map((media) => (
                  <div key={media.id} className="nexus-card overflow-hidden shadow-none">
                    <img src={media.url} alt={media.name} className="w-full aspect-video object-cover bg-slate-100" />
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-bold truncate">{media.name}</p>
                      <input
                        readOnly
                        value={media.url}
                        onFocus={(e) => e.currentTarget.select()}
                        className="nexus-input w-full px-2.5 py-2 text-[11px] font-mono outline-none"
                        aria-label={`Media URL for ${media.name}`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => copyMediaUrl(media.url)} className="h-8 px-3">
                          <Copy className="h-3.5 w-3.5" /> Copy URL
                        </Button>
                        <Button variant="destructive" onClick={() => runAction(() => deleteMedia(media.id), "Media deleted.")} className="h-8 px-3">Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "ads" && (
            <DataPanel title="Advertisement Slots">
              {ads.map((ad) => (
                <div key={ad.id} className="p-4 border-b border-slate-100 dark:border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between"><p className="font-bold capitalize">{ad.placement}</p><Button variant="outline" onClick={() => setEditingAd(editingAd?.id === ad.id ? null : ad)} className="h-8 px-3">Edit</Button></div>
                  {editingAd?.id === ad.id && (
                    <form onSubmit={(e) => { e.preventDefault(); runAction(() => saveAd(editingAd.placement, editingAd.code, editingAd.active), "Ad saved."); setEditingAd(null); }} className="space-y-3">
                      <textarea value={editingAd.code} onChange={(e) => setEditingAd({ ...editingAd, code: e.target.value })} rows={5} className="w-full rounded-xl border bg-transparent p-3 text-xs font-mono" />
                      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={editingAd.active} onChange={(e) => setEditingAd({ ...editingAd, active: e.target.checked })} /> Active</label>
                      <Button type="submit">Save Ad</Button>
                    </form>
                  )}
                </div>
              ))}
            </DataPanel>
          )}

          {(activeTab === "site" || activeTab === "mail") && (
            <MotionForm {...panelMotion} onSubmit={(e) => { e.preventDefault(); runAction(() => saveSiteSettings(settings), "Settings saved."); }} className={activeTab === "site" ? "grid grid-cols-1 xl:grid-cols-12 gap-5" : "nexus-card p-5 space-y-4"}>
              {activeTab === "site" ? (
                <>
                  <Card className="xl:col-span-7 overflow-hidden">
                    <CardHeader className="bg-white/35 dark:bg-white/[0.03] flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <Badge className="w-fit border-blue-200/70 bg-blue-50/80 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">Website Content</Badge>
                        <CardTitle className="mt-3">Custom Pages Editor</CardTitle>
                        <p className="mt-1 text-xs text-gray-500">Edit the About Us, Privacy Policy, and Contact pages directly.</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl w-fit shrink-0 border border-slate-200/30 dark:border-zinc-800">
                        {(["about", "privacy", "contact"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSitePreviewTab(mode)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${sitePreviewTab === mode ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"}`}
                          >
                            {mode === "about" ? "About Us" : mode === "privacy" ? "Privacy Policy" : "Contact"}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sitePreviewTab === "about" && (
                        <>
                          <Input label="Eyebrow" value={settings.about_eyebrow} onChange={(value) => setSettings({ ...settings, about_eyebrow: value })} />
                          <Input label="Title" value={settings.about_title} onChange={(value) => setSettings({ ...settings, about_title: value })} />
                          <Textarea label="Intro" value={settings.about_intro} onChange={(value) => setSettings({ ...settings, about_intro: value })} rows={3} />
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-2">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Dynamic Features List ({aboutFeatures.length})</span>
                              <Button type="button" variant="outline" onClick={addFeature} className="h-8">
                                + Add Feature
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {aboutFeatures.map((feat, index) => (
                                <div key={index} className="space-y-3 rounded-xl border border-[var(--nexus-card-border)] bg-slate-900/5 dark:bg-white/[0.02] p-3.5 relative group">
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                    title="Remove Feature"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <div className="pr-6">
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Feature {index + 1} Title</label>
                                    <ShadInput
                                      value={feat.title}
                                      onChange={(e) => updateFeature(index, "title", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Feature {index + 1} Description</label>
                                    <ShadTextarea
                                      value={feat.body}
                                      onChange={(e) => updateFeature(index, "body", e.target.value)}
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <label className="block">
                            <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">About Page Body</span>
                            <RichStoryEditor value={settings.about_body || ""} onChange={(value) => setSettings({ ...settings, about_body: value })} />
                          </label>
                        </>
                      )}

                      {sitePreviewTab === "privacy" && (
                        <>
                          <Input label="Privacy Policy Page Title" value={settings.privacy_title} onChange={(value) => setSettings({ ...settings, privacy_title: value })} />
                          <label className="block">
                            <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Privacy Policy Body</span>
                            <RichStoryEditor value={settings.privacy_body || ""} onChange={(value) => setSettings({ ...settings, privacy_body: value })} />
                          </label>
                        </>
                      )}

                      {sitePreviewTab === "contact" && (
                        <>
                          <Input label="Contact Page Eyebrow" value={settings.contact_eyebrow} onChange={(value) => setSettings({ ...settings, contact_eyebrow: value })} />
                          <Input label="Contact Page Title" value={settings.contact_title} onChange={(value) => setSettings({ ...settings, contact_title: value })} />
                          <Textarea label="Contact Page Description" value={settings.contact_description} onChange={(value) => setSettings({ ...settings, contact_description: value })} rows={4} />
                        </>
                      )}

                      <Button type="submit">
                        <Save className="h-4 w-4" /> Save Website Content
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="xl:col-span-5 overflow-hidden">
                    <CardHeader>
                      <CardTitle>Live Preview</CardTitle>
                      <p className="mt-1 text-xs text-gray-500">
                        This matches the public {" "}
                        {sitePreviewTab === "about" ? "About Us" : sitePreviewTab === "privacy" ? "Privacy Policy" : "Contact"} page.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {sitePreviewTab === "about" && (
                        <>
                          <div>
                            <Badge className="mb-3">{settings.about_eyebrow || "Editorial Manifesto"}</Badge>
                            <h3 className="text-2xl font-black leading-tight text-slate-950 dark:text-zinc-50">{settings.about_title || "Where technology intersects human curiosity."}</h3>
                            <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-zinc-300">{settings.about_intro || "ArticleDestiny is a boutique publishing engine curated to inspire and inform developers, digital designers, and tech enthusiasts."}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {aboutFeatures.map((feat, i) => (
                              <div key={i} className="rounded-xl border border-[var(--nexus-card-border)] p-4">
                                <p className="text-sm font-bold">{feat.title}</p>
                                <p className="mt-2 text-xs leading-6 nexus-text-muted">{feat.body}</p>
                              </div>
                            ))}
                          </div>
                          <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/70 bg-white/55 p-4 text-sm dark:border-white/10 dark:bg-white/5" dangerouslySetInnerHTML={{ __html: settings.about_body || "<p>About page body preview appears here.</p>" }} />
                        </>
                      )}

                      {sitePreviewTab === "privacy" && (
                        <>
                          <div>
                            <h3 className="text-2xl font-black leading-tight text-slate-950 dark:text-zinc-50">{settings.privacy_title || "Privacy Policy"}</h3>
                          </div>
                          <div className="max-h-[620px] overflow-auto rounded-2xl border border-white/70 bg-white/55 p-4 text-sm dark:border-white/10 dark:bg-white/5" dangerouslySetInnerHTML={{ __html: settings.privacy_body || "<p>Privacy policy body preview appears here.</p>" }} />
                        </>
                      )}

                      {sitePreviewTab === "contact" && (
                        <>
                          <div className="text-center py-6 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                            <Badge className="mb-3">{settings.contact_eyebrow || "Get in Touch"}</Badge>
                            <h3 className="text-xl font-black leading-tight text-slate-950 dark:text-zinc-50">{settings.contact_title || "Connect with ArticleDestiny"}</h3>
                            <p className="mt-2 text-xs px-4 text-gray-500 dark:text-zinc-400">{settings.contact_description || "Suggestions, submissions, editorial pitches, or general design reviews."}</p>
                          </div>
                          <div className="p-4 border border-[var(--nexus-card-border)] rounded-xl bg-white dark:bg-zinc-950/60 opacity-80 select-none">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview Form Fields</p>
                            <div className="mt-3 space-y-2">
                              <div className="h-8 bg-slate-100 dark:bg-zinc-900 rounded-lg"></div>
                              <div className="h-8 bg-slate-100 dark:bg-zinc-900 rounded-lg"></div>
                              <div className="h-20 bg-slate-100 dark:bg-zinc-900 rounded-lg"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <h2 className="text-sm font-black uppercase tracking-widest">SMTP Mail Setup</h2>
                  <Input label="SMTP Host" value={settings.mail_host} onChange={(value) => setSettings({ ...settings, mail_host: value })} />
                  <Input label="SMTP Port" value={settings.mail_port} onChange={(value) => setSettings({ ...settings, mail_port: value })} />
                  <Input label="SMTP User" value={settings.mail_user} onChange={(value) => setSettings({ ...settings, mail_user: value })} />
                  <Input label="SMTP Password / App Password" type="password" value={settings.mail_pass} onChange={(value) => setSettings({ ...settings, mail_pass: value })} />
                  <Input label="From Email" value={settings.mail_from} onChange={(value) => setSettings({ ...settings, mail_from: value })} />
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--nexus-text-main)]"><input type="checkbox" checked={settings.mail_secure === "true"} onChange={(e) => setSettings({ ...settings, mail_secure: String(e.target.checked) })} /> Use secure SSL/TLS</label>
                </>
              )}
              {activeTab === "mail" && (
                <>
                  <Button type="submit"><Save className="h-4 w-4" /> Save Settings</Button>
                  <div className="pt-4 border-t border-[var(--nexus-card-border)] space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--nexus-text-main)]">Send Test Email</h3>
                    <p className="text-xs text-[var(--nexus-text-muted)]">Verify your SMTP settings by sending a test email. Save settings first before testing.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <ShadInput
                        type="email"
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                        placeholder="recipient@example.com"
                      />
                      <Button
                        type="button"
                        disabled={testEmailSending || !testEmailTo.trim()}
                        onClick={async () => {
                          setTestEmailSending(true);
                          setMessage("");
                          setErrorMsg("");
                          try {
                            const result = await sendTestEmail(testEmailTo);
                            if (result.error) setErrorMsg(result.error);
                            else setMessage("Test email sent successfully! Check your inbox.");
                          } catch (err: any) {
                            setErrorMsg(err.message || "Failed to send test email.");
                          } finally {
                            setTestEmailSending(false);
                          }
                        }}
                        className="shrink-0"
                      >
                        <Mail className="h-4 w-4" />
                        {testEmailSending ? "Sending..." : "Send Test"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </MotionForm>
          )}
        </MotionDiv>
      </main>
      {previewArticle && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-xl">
          <div className="nexus-card max-h-[92vh] w-full max-w-5xl overflow-hidden">
            <div className="nexus-card-header flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Badge className="mb-2 border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300">{previewArticle.category}</Badge>
                <h2 className="text-xl font-black leading-tight text-[var(--nexus-text-main)]">{previewArticle.title}</h2>
                <p className="mt-1 text-xs nexus-text-muted">/{previewArticle.slug} - SEO {previewArticle.seoScore}/100</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/blog/${previewArticle.slug}`)} className="h-9 px-3">Open Page</Button>
                <Button variant="ghost" onClick={() => setPreviewArticle(null)} className="h-9 w-9 p-0" aria-label="Close story preview">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-5 sm:p-7">
              {previewArticle.coverImage && (
                <img src={previewArticle.coverImage} alt={previewArticle.title} className="mb-6 h-64 w-full rounded-xl border border-[var(--nexus-card-border)] object-cover" />
              )}
              <p className="mb-6 border-l-2 border-blue-500 pl-4 text-sm leading-7 nexus-text-muted">{previewArticle.excerpt}</p>
              <article
                id="article-body"
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderArticleContent(previewArticle.content) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white/35 dark:bg-white/[0.03]">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div>{children}</div>
    </Card>
  );
}

function Row({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0"><p className="font-bold truncate">{title}</p><p className="text-[11px] text-gray-500 truncate">{subtitle}</p></div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{label}</span>
      <ShadInput type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Textarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{label}</span>
      <ShadTextarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </label>
  );
}

