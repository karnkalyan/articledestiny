"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
  Trash2,
  Users,
  X,
  Gauge,
  LogOut,
} from "lucide-react";
import { getMe, logoutUser } from "@/actions/auth";
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
  saveSiteSettings,
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

const emptySettings = {
  about_eyebrow: "Editorial Manifesto",
  about_title: "Where technology intersects human curiosity.",
  about_intro: "ArticleDestiny is a boutique publishing engine curated to inspire and inform developers, digital designers, and tech enthusiasts.",
  about_feature_one_title: "Curated Exploration",
  about_feature_one_body: "Thoughtful stories, clean publishing, and a reading experience built for attention.",
  about_feature_two_title: "Privacy First Ecosystem",
  about_feature_two_body: "Reader history stays local or securely tied to authenticated accounts.",
  about_body: "<p>Established in 2026, ArticleDestiny grew from a single developer's dissatisfaction with algorithmic content feeds. Recognizing the beauty in focused, long-form technical literature, we developed an application with an unyielding dedication to visual rhythm and structural clarity.</p><p>We hope our platform inspires you to think deeply, experiment creatively, and contribute constructively to the active dialogue thread below each article on our server.</p>",
  mail_host: "",
  mail_port: "587",
  mail_user: "",
  mail_pass: "",
  mail_from: "",
  mail_secure: "false",
  site_url: "http://localhost:3400",
  google_search_console_verification: "",
  ga4_measurement_id: "",
  adsense_client_id: "",
  adsense_auto_ads: "true",
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
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>(emptySettings);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", role: "USER", password: "user123_temp" });
  const [aboutFeatures, setAboutFeatures] = useState<Array<{ title: string; body: string }>>([]);

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

  const isAdmin = currentUser?.role === "ADMIN";
  const authorized = !!currentUser && !currentUser.isBanned && (currentUser.role === "ADMIN" || currentUser.role === "AUTHOR");

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);
  const unreadMessages = messages.filter((item) => item.status === "NEW").length;
  const filteredArticles = useMemo(() => {
    const q = query.toLowerCase();
    return articles.filter((article) => `${article.title} ${article.category} ${article.slug}`.toLowerCase().includes(q));
  }, [articles, query]);

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
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-[var(--grad-primary)] text-white inline-flex items-center justify-center text-sm font-black shadow-lg shadow-cyan-500/20">A</span>
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
                active ? "bg-[var(--sidebar-active-bg)] text-[var(--nexus-text-main)] border-l-[3px] border-cyan-500" : "text-[var(--nexus-text-muted)] hover:bg-slate-900/5 dark:hover:bg-white/[0.035] hover:text-[var(--nexus-text-main)]"
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
        <Link href="/login" className="inline-block mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Sign In</Link>
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
                <h1 className="text-lg font-black truncate bg-[var(--grad-primary)] bg-clip-text text-transparent">Admin Panel</h1>
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

          {activeTab === "google" && (
            <MotionForm {...panelMotion} onSubmit={(e) => { e.preventDefault(); runAction(() => saveSiteSettings(settings), "Google and site settings saved."); }} className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <section className="xl:col-span-7 rounded-3xl bg-white/75 dark:bg-zinc-950/60 border border-white/70 dark:border-white/10 p-5 sm:p-6 shadow-2xl shadow-indigo-200/30 dark:shadow-black/30 backdrop-blur-xl space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black text-indigo-600">Google Control Room</p>
                  <h2 className="text-xl font-black mt-1">Search Console, Analytics, and AdSense</h2>
                  <p className="text-xs text-gray-500 mt-1">Save once here. The app injects verification, GA4, AdSense, robots, and sitemap URLs automatically.</p>
                </div>
                <Input label="Public Site URL" value={settings.site_url} onChange={(value) => setSettings({ ...settings, site_url: value })} />
                <Input label="Google Search Console Verification Token" value={settings.google_search_console_verification} onChange={(value) => setSettings({ ...settings, google_search_console_verification: value })} />
                <Input label="GA4 Measurement ID" value={settings.ga4_measurement_id} onChange={(value) => setSettings({ ...settings, ga4_measurement_id: value })} />
                <Input label="AdSense Publisher Client ID" value={settings.adsense_client_id} onChange={(value) => setSettings({ ...settings, adsense_client_id: value })} />
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={settings.adsense_auto_ads !== "false"} onChange={(e) => setSettings({ ...settings, adsense_auto_ads: String(e.target.checked) })} />
                  Load AdSense script globally for Auto Ads
                </label>
                <Button type="submit">
                  <Save className="h-4 w-4" /> Save Google Setup
                </Button>
              </section>

              <section className="xl:col-span-5 rounded-3xl bg-slate-950 text-white border border-white/10 p-5 sm:p-6 shadow-2xl shadow-slate-900/30 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest">What These Fields Do</h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p><strong className="text-white">Search Console:</strong> paste only the verification token. The app renders the required meta tag.</p>
                  <p><strong className="text-white">Sitemap:</strong> generated live at <span className="text-cyan-300">{(settings.site_url || "http://localhost:3400").replace(/\/+$/, "")}/sitemap.xml</span>.</p>
                  <p><strong className="text-white">GA4:</strong> use an ID like <span className="text-cyan-300">G-XXXXXXXXXX</span>. The tracking script loads automatically.</p>
                  <p><strong className="text-white">AdSense:</strong> use an ID like <span className="text-cyan-300">ca-pub-XXXXXXXXXXXXXXXX</span>. Ad slot HTML is still managed in the Ads tab.</p>
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
                      <Button variant="outline" onClick={() => router.push(`/blog/${article.slug}`)} className="h-8 px-3">View</Button>
                      <Button onClick={() => router.push(`/admin/write?id=${article.id}`)} className="h-8 px-3">Edit</Button>
                      <Button variant="destructive" onClick={() => runAction(() => deleteArticle(article.id), "Story deleted.")} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </MotionDiv>
                ))}
              </MotionDiv>
            </MotionPanel>
          )}

          {activeTab === "subscribers" && (
            <DataPanel title={`Subscribers (${subscribers.length})`}>
              {subscribers.map((subscriber) => (
                <Row key={subscriber.id} title={subscriber.email} subtitle={new Date(subscriber.createdAt).toLocaleDateString()}>
                  <Button variant="destructive" onClick={() => runAction(() => deleteSubscriber(subscriber.id), "Subscriber removed.")} className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                </Row>
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
                  <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">{messages.length} total</Badge>
                  <Badge className="border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300">{unreadMessages} new</Badge>
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
              <form onSubmit={(e) => { e.preventDefault(); runAction(() => createUserFromAdmin(newUserForm), "User created."); }} className="nexus-card p-5 space-y-3">
                <h2 className="nexus-card-title">New User</h2>
                {["name", "email", "password"].map((field) => (
                  <input key={field} value={(newUserForm as any)[field]} onChange={(e) => setNewUserForm({ ...newUserForm, [field]: e.target.value })} placeholder={field} className="nexus-input w-full px-3 py-2 text-xs outline-none" required />
                ))}
                <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })} className="nexus-input w-full px-3 py-2 text-xs outline-none">
                  <option value="USER">USER</option><option value="AUTHOR">AUTHOR</option><option value="ADMIN">ADMIN</option>
                </select>
                <Button type="submit" className="w-full">Create User</Button>
              </form>
              <div className="xl:col-span-2">
                <DataPanel title={`Users (${users.length})`}>
                  {users.map((user) => (
                    <Row key={user.id} title={user.name} subtitle={`${user.email} · ${user.role}${user.isBanned ? " · Banned" : ""}`}>
                      <Button variant="outline" disabled={user.id === currentUser?.id} onClick={() => runAction(() => handleUserRoleOrBan(user.id, String(user.role), user.isBanned, "role"), "Role updated.")} className="h-8 px-3">Role</Button>
                      <Button variant="destructive" disabled={user.id === currentUser?.id} onClick={() => runAction(() => handleUserRoleOrBan(user.id, String(user.role), user.isBanned, "ban"), "Ban status updated.")} className="h-8 px-3">{user.isBanned ? "Unban" : "Ban"}</Button>
                    </Row>
                  ))}
                </DataPanel>
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
                    <div className="p-3">
                      <p className="text-xs font-bold truncate">{media.name}</p>
                      <Button variant="destructive" onClick={() => runAction(() => deleteMedia(media.id), "Media deleted.")} className="mt-2 h-8 px-3 w-full">Delete</Button>
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
                    <CardHeader className="bg-white/35 dark:bg-white/[0.03]">
                      <Badge className="w-fit border-cyan-200/70 bg-cyan-50/80 text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">Website Content</Badge>
                      <CardTitle className="mt-3">Editable About Page</CardTitle>
                      <p className="mt-1 text-xs text-gray-500">Update the public About page directly from the admin panel using rich text.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                      <Button type="submit">
                        <Save className="h-4 w-4" /> Save Website Content
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="xl:col-span-5 overflow-hidden">
                    <CardHeader>
                      <CardTitle>Live About Preview</CardTitle>
                      <p className="mt-1 text-xs text-gray-500">This mirrors what visitors see on the About page after saving.</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
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
                  <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={settings.mail_secure === "true"} onChange={(e) => setSettings({ ...settings, mail_secure: String(e.target.checked) })} /> Use secure SSL/TLS</label>
                </>
              )}
              {activeTab === "mail" && <Button type="submit"><Save className="h-4 w-4" /> Save Settings</Button>}
            </MotionForm>
          )}
        </MotionDiv>
      </main>
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

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{label}</span>
      <ShadInput type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} />
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
