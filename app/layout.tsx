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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ArticleDestiny - Tech, Design, and Developer Stories",
    template: "%s | ArticleDestiny",
  },
  description: "Read practical technology, design, productivity, and developer stories from ArticleDestiny.",
  applicationName: "ArticleDestiny",
  authors: [{ name: "ArticleDestiny Editorial" }],
  creator: "ArticleDestiny",
  publisher: "ArticleDestiny",
  keywords: ["technology articles", "developer stories", "design essays", "productivity", "software engineering", "ArticleDestiny"],
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
    title: "ArticleDestiny - Tech, Design, and Developer Stories",
    description: "Read practical technology, design, productivity, and developer stories from ArticleDestiny.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArticleDestiny - Tech, Design, and Developer Stories",
    description: "Read practical technology, design, productivity, and developer stories from ArticleDestiny.",
  },
};

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

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {gscToken && <meta name="google-site-verification" content={gscToken} />}
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
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
