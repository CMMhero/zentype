"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCommand, IconKeyboardFilled, IconLayoutDashboard,
  IconLogout, IconSettings, IconTrophy, IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Combobox, type ComboboxItem } from "~/components/ui/combobox";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";
import { signOutFn } from "~/server/auth";
import { THEMES, getTheme } from "~/lib/themes";
import { useGlobalHotkeys } from "~/hooks/use-global-hotkeys";
import { useSettingsSync } from "~/hooks/use-settings-sync";
import { useUser } from "~/components/user-provider";
import type { FontFamily, SessionUser } from "~/lib/types";

const NAV = [
  { to: "/", label: "test", icon: IconKeyboardFilled },
  { to: "/leaderboard", label: "leaderboard", icon: IconTrophy },
  { to: "/profile", label: "profile", icon: IconLayoutDashboard },
  { to: "/settings", label: "settings", icon: IconSettings },
] as const;

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const fontFamily = useSettingsStore((s) => s.settings.fontFamily);
  const updateSettings = useSettingsStore((s) => s.update);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  useEffect(() => {
    if (!user) { setUserLevel(null); return; }
    let cancelled = false;
    void import("~/server/gamification").then(({ getUserPoints }) =>
      getUserPoints().then((p) => { if (!cancelled && p) setUserLevel(p.level); })
    );
    return () => { cancelled = true; };
  }, [user]);

  useGlobalHotkeys();
  useSettingsSync();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-appearance", getTheme(themeId).appearance);
  }, [themeId]);

  // Apply font family to html element via data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-font", fontFamily);
  }, [fontFamily]);

  async function handleSignOut() {
    await signOutFn();
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="border-border/40 bg-background/80 sticky top-0 z-40 border-b shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" role="banner">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="Zentype home"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.dispatchEvent(new Event("zt:restart"));
              }
            }}
          >
            <IconKeyboardFilled className="text-primary size-5" />
            <span className="text-sm font-semibold tracking-tight">zentype</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {NAV.map((item, i) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.to}
                      className={`rounded px-2.5 py-1.5 text-xs transition-colors ${active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                      onClick={(e) => {
                        if (pathname === item.to) {
                          e.preventDefault();
                          window.dispatchEvent(new Event("zt:restart"));
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex items-center gap-1.5">
                    <Kbd>alt</Kbd>+<Kbd>{i + 1}</Kbd>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setPaletteOpen(true)} aria-label="Open command palette (Ctrl+K)">
              <span className="hidden sm:inline text-muted-foreground">commands</span>
              <Kbd><IconCommand className="size-3" />k</Kbd>
            </Button>

            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} userLevel={userLevel} />
            ) : (
              <Button variant="secondary" size="sm" asChild className="text-xs">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 flex-col" role="main">{children}</main>

      <footer className="text-muted-foreground mt-auto" role="contentinfo">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[11px]">
          <span className="flex items-center gap-2">
            <span>Made by <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">CMMhero</a></span>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">Terms</Link>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy</Link>
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Combobox
              items={THEME_FOOTER_ITEMS}
              value={themeId}
              onValueChange={(v) => updateSettings({ themeId: v })}
              placeholder="Theme"
              searchPlaceholder="Search themes…"
              className="h-7 text-[11px]"
            />
            <Combobox
              items={FONT_FOOTER_ITEMS}
              value={fontFamily}
              onValueChange={(v) => updateSettings({ fontFamily: v as FontFamily })}
              placeholder="Font"
              searchPlaceholder="Search fonts…"
              className="h-7 text-[11px]"
            />
          </span>
        </div>
      </footer>
    </div>
  );
}

const THEME_FOOTER_ITEMS: ComboboxItem[] = [...THEMES]
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((t) => ({
    value: t.id,
    label: t.label,
    leading: (
      <span className="flex shrink-0 gap-0.5">
        <span className="size-3 rounded-sm border border-border" style={{ background: t.vars["--background"] }} />
        <span className="size-3 rounded-sm" style={{ background: t.vars["--primary"] }} />
      </span>
    ),
  }));

const FONT_FOOTER_ITEMS: ComboboxItem[] = [
  { value: "anonymous-pro", label: "Anonymous Pro", leading: <span style={{ fontFamily: "var(--font-anonymous-pro)" }}>Aa</span> },
  { value: "barlow", label: "Barlow", leading: <span style={{ fontFamily: "var(--font-barlow)" }}>Aa</span> },
  { value: "bebas-neue", label: "Bebas Neue", leading: <span style={{ fontFamily: "var(--font-bebas-neue)" }}>Aa</span> },
  { value: "bricolage-grotesque", label: "Bricolage Grotesque", leading: <span style={{ fontFamily: "var(--font-bricolage-grotesque)" }}>Aa</span> },
  { value: "bitter", label: "Bitter", leading: <span style={{ fontFamily: "var(--font-bitter)" }}>Aa</span> },
  { value: "cal-sans", label: "Cal Sans", leading: <span style={{ fontFamily: "var(--font-cal-sans)" }}>Aa</span> },
  { value: "cabin", label: "Cabin", leading: <span style={{ fontFamily: "var(--font-cabin)" }}>Aa</span> },
  { value: "cascadia-code", label: "Cascadia Code", leading: <span style={{ fontFamily: "var(--font-cascadia-code)" }}>Aa</span> },
  { value: "comic-neue", label: "Comic Sans", leading: <span style={{ fontFamily: "var(--font-comic-neue)" }}>Aa</span> },
  { value: "commit-mono", label: "Commit Mono", leading: <span style={{ fontFamily: "var(--font-commit-mono)" }}>Aa</span> },
  { value: "crimson-pro", label: "Crimson Pro", leading: <span style={{ fontFamily: "var(--font-crimson-pro)" }}>Aa</span> },
  { value: "dm-sans", label: "DM Sans", leading: <span style={{ fontFamily: "var(--font-dm-sans)" }}>Aa</span> },
  { value: "exo-2", label: "Exo 2", leading: <span style={{ fontFamily: "var(--font-exo-2)" }}>Aa</span> },
  { value: "fira-code", label: "Fira Code", leading: <span style={{ fontFamily: "var(--font-fira-code)" }}>Aa</span> },
  { value: "geist", label: "Geist", leading: <span style={{ fontFamily: "var(--font-geist)" }}>Aa</span> },
  { value: "geist-mono", label: "Geist Mono", leading: <span style={{ fontFamily: "var(--font-geist-mono)" }}>Aa</span> },
  { value: "google-sans", label: "Google Sans", leading: <span style={{ fontFamily: "var(--font-google-sans)" }}>Aa</span> },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", leading: <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Aa</span> },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", leading: <span style={{ fontFamily: "var(--font-ibm-plex-sans)" }}>Aa</span> },
  { value: "inconsolata", label: "Inconsolata", leading: <span style={{ fontFamily: "var(--font-inconsolata)" }}>Aa</span> },
  { value: "inter", label: "Inter", leading: <span style={{ fontFamily: "var(--font-inter)" }}>Aa</span> },
  { value: "jetbrains-mono", label: "JetBrains Mono", leading: <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>Aa</span> },
  { value: "josefin-sans", label: "Josefin Sans", leading: <span style={{ fontFamily: "var(--font-josefin-sans)" }}>Aa</span> },
  { value: "lato", label: "Lato", leading: <span style={{ fontFamily: "var(--font-lato)" }}>Aa</span> },
  { value: "lexend", label: "Lexend", leading: <span style={{ fontFamily: "var(--font-lexend)" }}>Aa</span> },
  { value: "lora", label: "Lora", leading: <span style={{ fontFamily: "var(--font-lora)" }}>Aa</span> },
  { value: "manrope", label: "Manrope", leading: <span style={{ fontFamily: "var(--font-manrope)" }}>Aa</span> },
  { value: "merriweather", label: "Merriweather", leading: <span style={{ fontFamily: "var(--font-merriweather)" }}>Aa</span> },
  { value: "mona-sans", label: "Mona Sans", leading: <span style={{ fontFamily: "var(--font-mona-sans)" }}>Aa</span> },
  { value: "montserrat", label: "Montserrat", leading: <span style={{ fontFamily: "var(--font-montserrat)" }}>Aa</span> },
  { value: "noto-sans", label: "Noto Sans", leading: <span style={{ fontFamily: "var(--font-noto-sans)" }}>Aa</span> },
  { value: "noto-serif", label: "Noto Serif", leading: <span style={{ fontFamily: "var(--font-noto-serif)" }}>Aa</span> },
  { value: "nunito-sans", label: "Nunito Sans", leading: <span style={{ fontFamily: "var(--font-nunito-sans)" }}>Aa</span> },
  { value: "open-sans", label: "Open Sans", leading: <span style={{ fontFamily: "var(--font-open-sans)" }}>Aa</span> },
  { value: "oswald", label: "Oswald", leading: <span style={{ fontFamily: "var(--font-oswald)" }}>Aa</span> },
  { value: "outfit", label: "Outfit", leading: <span style={{ fontFamily: "var(--font-outfit)" }}>Aa</span> },
  { value: "playfair-display", label: "Playfair Display", leading: <span style={{ fontFamily: "var(--font-playfair-display)" }}>Aa</span> },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", leading: <span style={{ fontFamily: "var(--font-plus-jakarta-sans)" }}>Aa</span> },
  { value: "poppins", label: "Poppins", leading: <span style={{ fontFamily: "var(--font-poppins)" }}>Aa</span> },
  { value: "pt-sans", label: "PT Sans", leading: <span style={{ fontFamily: "var(--font-pt-sans)" }}>Aa</span> },
  { value: "pt-serif", label: "PT Serif", leading: <span style={{ fontFamily: "var(--font-pt-serif)" }}>Aa</span> },
  { value: "raleway", label: "Raleway", leading: <span style={{ fontFamily: "var(--font-raleway)" }}>Aa</span> },
  { value: "roboto-flex", label: "Roboto Flex", leading: <span style={{ fontFamily: "var(--font-roboto-flex)" }}>Aa</span> },
  { value: "roboto-mono", label: "Roboto Mono", leading: <span style={{ fontFamily: "var(--font-roboto-mono)" }}>Aa</span> },
  { value: "source-code-pro", label: "Source Code Pro", leading: <span style={{ fontFamily: "var(--font-source-code-pro)" }}>Aa</span> },
  { value: "space-grotesk", label: "Space Grotesk", leading: <span style={{ fontFamily: "var(--font-space-grotesk)" }}>Aa</span> },
  { value: "space-mono", label: "Space Mono", leading: <span style={{ fontFamily: "var(--font-space-mono)" }}>Aa</span> },
  { value: "titillium-web", label: "Titillium Web", leading: <span style={{ fontFamily: "var(--font-titillium-web)" }}>Aa</span> },
  { value: "ubuntu-mono", label: "Ubuntu Mono", leading: <span style={{ fontFamily: "var(--font-ubuntu-mono)" }}>Aa</span> },
  { value: "victor-mono", label: "Victor Mono", leading: <span style={{ fontFamily: "var(--font-victor-mono)" }}>Aa</span> },
  { value: "work-sans", label: "Work Sans", leading: <span style={{ fontFamily: "var(--font-work-sans)" }}>Aa</span> },
];

function UserMenu({ user, onSignOut, userLevel }: { user: SessionUser; onSignOut: () => void; userLevel: number | null }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-muted flex items-center gap-2 rounded-md px-1 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Account menu">
          <Avatar className="size-6">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="rounded text-[10px] uppercase">{user.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-xs sm:inline">{user.username}</span>
          {userLevel !== null && (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
              {userLevel}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">
          <div className="flex items-center gap-2">
            <span className="truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}><IconUser className="size-4" /> profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}><IconSettings className="size-4" /> settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}><IconLogout className="size-4" /> sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
