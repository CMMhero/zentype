import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { AppShell } from "~/components/layout/app-shell";
import { DynamicFavicon } from "~/components/ui/dynamic-favicon";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { UserProvider } from "~/components/user-provider";
import { DEFAULT_THEME_ID, THEMES, themeStyleSheet } from "~/lib/themes";
import { cn } from "~/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appearanceMap: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.appearance]),
);

const themeBootstrapScript = `
(function(){
  try {
    var raw = localStorage.getItem('zentype-settings');
    var st = raw ? (JSON.parse(raw).state||{}).settings : null;
    var t = (st && st.themeId) || '${DEFAULT_THEME_ID}';
    var f = (st && st.fontFamily) || 'work-sans';
    var map = ${JSON.stringify(appearanceMap)};
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-appearance', map[t] || 'dark');
    document.documentElement.setAttribute('data-font', f);
  } catch(e) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "zentype - a customizable, clean typing test",
    template: "%s | zentype",
  },
  description:
    "A customizable, clean typing test. Track your WPM, accuracy, and consistency. Compete on global leaderboards, earn XP, and unlock achievements. Inspired by monkeytype, built with Next.js, Supabase, and Tailwind CSS.",
  keywords: [
    "typing test",
    "typing speed",
    "wpm",
    "words per minute",
    "typing practice",
    "keyboard test",
    "leaderboard",
    "typing game",
    "speed test",
    "accuracy test",
    "monkeytype alternative",
    "typing test online free",
    "typing test with leaderboard",
    "typing practice app",
    "wpm test",
    "typing speed test online",
  ],
  authors: [{ name: "CMMhero", url: "https://cmmhero.top" }],
  creator: "CMMhero",
  publisher: "zentype",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://zentype.cmmhero.top"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "zentype",
    title: "zentype - a customizable, clean typing test",
    description:
      "A customizable, clean typing test. Track your WPM, accuracy, and consistency. Compete on global leaderboards.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "zentype - a customizable, clean typing test",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "zentype - a customizable, clean typing test",
    description: "A customizable, clean typing test. Track your WPM, accuracy, and consistency.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "application-name": "zentype",
    "msapplication-TileColor": "#282828",
    "theme-color": "#282828",
    // AI/LLM metadata
    "ai-content-declaration": "human-authored",
    "ai-training": "opt-out",
  },
};

// Deliberately synchronous: the root layout must not await anything (no auth
// round-trip, no DB calls). Next.js re-executes shared layouts on client-side
// navigation, so an await here would make every page change wait on the server
// before even showing the route's loading skeleton. The signed-in user is
// resolved client-side in <UserProvider> instead.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "zentype",
    description: "A customizable typing test with leaderboards, achievements, and stats.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://zentype.cmmhero.top",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "CMMhero",
      url: "https://cmmhero.top",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#282828" />
        <meta name="color-scheme" content="dark light" />
        <meta name="application-name" content="zentype" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static bootstrap script to avoid FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme CSS variables */}
        <style dangerouslySetInnerHTML={{ __html: themeStyleSheet() }} id="zt-theme-vars" />
      </head>
      <body className="antialiased">
        <TooltipProvider>
          <DynamicFavicon />
          <UserProvider>
            <AppShell>{children}</AppShell>
          </UserProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
