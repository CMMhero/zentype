import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { DynamicFavicon } from "~/components/ui/dynamic-favicon";
import { AppShell } from "~/components/layout/app-shell";
import { CommandPalette } from "~/components/layout/command-palette";
import { HelpDialog } from "~/components/layout/help-dialog";
import { UserProvider } from "~/components/user-provider";
import { getSessionUser } from "~/server/auth";
import { themeStyleSheet, THEMES, DEFAULT_THEME_ID } from "~/lib/themes";

const appearanceMap: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.appearance]),
);

const themeBootstrapScript = `
(function(){
  try {
    var raw = localStorage.getItem('zentype-settings');
    var st = raw ? (JSON.parse(raw).state||{}).settings : null;
    var t = (st && st.themeId) || '${DEFAULT_THEME_ID}';
    var f = (st && st.fontFamily) || 'geist-mono';
    var map = ${JSON.stringify(appearanceMap)};
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-appearance', map[t] || 'dark');
    document.documentElement.setAttribute('data-font', f);
  } catch(e) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "Zentype — Free Online Typing Test",
    template: "%s | Zentype",
  },
  description:
    "Improve your typing speed with Zentype. Track WPM, accuracy, and consistency. Compete on global leaderboards, earn achievements, and climb levels. Free, fast, and keyboard-first.",
  keywords: ["typing test", "typing speed", "wpm", "words per minute", "typing practice", "keyboard test", "typing game", "leaderboard"],
  authors: [{ name: "CMMhero" }],
  creator: "CMMhero",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://zentype.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Zentype",
    title: "Zentype — Free Online Typing Test",
    description:
      "Improve your typing speed with Zentype. Track WPM, accuracy, and consistency. Compete on global leaderboards and earn achievements.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Zentype — Online Typing Test",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zentype — Free Online Typing Test",
    description:
      "Improve your typing speed with Zentype. Track WPM, accuracy, and consistency.",
    images: ["/og.png"],
  },
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
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
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#282828" />
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeStyleSheet() }} id="zt-theme-vars" />
      </head>
      <body className="antialiased">
        <TooltipProvider>
          <DynamicFavicon />
          <UserProvider user={user}>
            <AppShell>
              {children}
            </AppShell>
          </UserProvider>
          <CommandPalette />
          <HelpDialog />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
