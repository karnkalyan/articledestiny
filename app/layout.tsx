import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getMe } from "@/actions/auth";
import Script from "next/script";
import { getPublicSiteSettings } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Hardcoded AdSense publisher ID as fallback — ensures the crawler ALWAYS sees the tag
const HARDCODED_ADSENSE_CLIENT = "ca-pub-8012743747071481";

export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = "ArticleDestiny - Tech, Design, and Developer Stories";
  let siteDescription = "Read practical technology, design, productivity, and developer stories from ArticleDestiny.";
  let siteKeywords = ["technology articles", "developer stories", "design essays", "productivity", "software engineering", "ArticleDestiny"];
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3400";

  try {
    const { db } = await import("@/lib/db");
    const seoRows = await db.siteSetting.findMany({
      where: { key: { in: ["site_title", "site_description", "site_keywords", "site_url", "site_og_image"] } },
    });
    const seo = Object.fromEntries(seoRows.map((r: any) => [r.key, r.value]));

    if (seo.site_title) siteTitle = seo.site_title;
    if (seo.site_description) siteDescription = seo.site_description;
    if (seo.site_keywords) siteKeywords = seo.site_keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    if (seo.site_url) siteUrl = seo.site_url.replace(/\/+$/, "");
  } catch (e) {
    // fallback to defaults
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: `%s | ArticleDestiny`,
    },
    description: siteDescription,
    applicationName: "ArticleDestiny",
    authors: [{ name: "ArticleDestiny Editorial" }],
    creator: "ArticleDestiny",
    publisher: "ArticleDestiny",
    keywords: siteKeywords,
    icons: {
      icon: "/logo/logo.png",
      shortcut: "/logo/logo.png",
      apple: "/logo/logo.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: "ArticleDestiny",
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
    verification: {
      google: HARDCODED_ADSENSE_CLIENT,
    },
    other: {
      "google-adsense-account": HARDCODED_ADSENSE_CLIENT,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getMe();
  const siteSettings = await getPublicSiteSettings();
  const gaId = siteSettings.ga4_measurement_id.trim();
  const adsenseClient = siteSettings.adsense_auto_ads !== "false" ? siteSettings.adsense_client_id.trim() : "";
  const gscToken = siteSettings.google_search_console_verification.trim();

  // Use DB value if available, otherwise hardcoded fallback
  const finalAdsenseClient = adsenseClient || HARDCODED_ADSENSE_CLIENT;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {gscToken && <meta name="google-site-verification" content={gscToken} />}
        {/* Always render AdSense meta tag and script for verification */}
        <meta name="google-adsense-account" content={finalAdsenseClient} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${finalAdsenseClient}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100 flex flex-col min-h-screen`}>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Navbar user={currentUser} />
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
