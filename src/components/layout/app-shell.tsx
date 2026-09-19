"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Footer } from "~/components/layout/footer";
import { MobileNav, Navbar } from "~/components/layout/navbar";
import { useGlobalHotkeys } from "~/hooks/use-global-hotkeys";
import { useSettingsSync } from "~/hooks/use-settings-sync";
import { getTheme } from "~/lib/themes";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";

const CommandPalette = dynamic(
  () => import("~/components/layout/command-palette").then((m) => m.CommandPalette),
  {
    ssr: false,
    loading: () => null,
  },
);
const HelpDialog = dynamic(
  () => import("~/components/layout/help-dialog").then((m) => m.HelpDialog),
  { ssr: false },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const fontFamily = useSettingsStore((s) => s.settings.fontFamily);
  const pathname = usePathname();
  const setTestRunning = useUiStore((s) => s.setTestRunning);

  useGlobalHotkeys();
  useSettingsSync();

  // Leaving the test page ends any in-progress run: the shell owns the
  // focus-mode flag (footer/nav fade), so clear it on navigation even if the
  // test page unmounted before its status effect could reset it.
  useEffect(() => {
    setTestRunning(false);
  }, [pathname, setTestRunning]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-appearance", getTheme(themeId).appearance);
  }, [themeId]);

  // Apply font family to html element via data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-font", fontFamily);
  }, [fontFamily]);

  return (
    // overflow-x-clip: belt-and-braces guard so an absolutely-positioned
    // decorative layer can never add a page-level horizontal scroll on mobile.
    // clip (unlike hidden) creates no scroll container, so sticky navs keep
    // sticking to the viewport.
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex flex-1 flex-col pb-16 md:pb-0">
        {children}
        <Footer />
        <CommandPalette />
        <HelpDialog />
      </main>
      <MobileNav />
    </div>
  );
}
