import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
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
    var map = ${JSON.stringify(appearanceMap)};
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-appearance', map[t] || 'dark');
  } catch(e) {}
})();
`;

export const metadata: Metadata = {
  title: "zentype",
  description:
    "A keyboard-first typing test. Quotes, anime synopses, wikipedia extracts and dictionary definitions. Track stats, climb leaderboards.",
  icons: { icon: "/logo.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeStyleSheet() }} id="zt-theme-vars" />
      </head>
      <body>
        <TooltipProvider>
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
