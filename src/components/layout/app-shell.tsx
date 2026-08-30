"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("~/components/layout/command-palette").then(m => m.CommandPalette), { ssr: false });
const HelpDialog = dynamic(() => import("~/components/layout/help-dialog").then(m => m.HelpDialog), { ssr: false });
import {
  IconCommand, IconKeyboardFilled, IconLogout,
  IconSettingsFilled, IconTrophyFilled, IconUserFilled,
  IconCode,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Skeleton } from "~/components/ui/skeleton";
import { Combobox, type ComboboxItem } from "~/components/ui/combobox";
import { lcGet } from "~/lib/client-cache";
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
  { to: "/leaderboard", label: "leaderboard", icon: IconTrophyFilled },
  { to: "/profile", label: "profile", icon: IconUserFilled },
  { to: "/settings", label: "settings", icon: IconSettingsFilled },
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
  const [userLevel, setUserLevel] = useState<number | null>(() => {
    if (!user) return null;
    const cached = lcGet<{ level: number }>(`${user.id}:profile-points`, 60 * 1000);
    return cached ? cached.level : null;
  });
  useEffect(() => {
    if (!user) { setUserLevel(null); return; }
    const cached = lcGet<{ level: number }>(`${user.id}:profile-points`, 60 * 1000);
    if (cached && userLevel === null) setUserLevel(cached.level);
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
    <div className="flex h-dvh flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="bg-background/80 sticky top-0 z-40 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" role="banner">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="zentype home"
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

          <nav className="ml-4 hidden items-center gap-2.5 md:flex" aria-label="Primary">
            {NAV.map((item, i) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.to}
                      aria-label={item.label}
                      className={`rounded p-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                      onClick={(e) => {
                        if (pathname === item.to) {
                          e.preventDefault();
                          window.dispatchEvent(new Event("zt:restart"));
                        }
                      }}
                    >
                      <item.icon className="size-5" stroke={1} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex items-center gap-1.5">
                    {item.label}
                    <Kbd>alt</Kbd>+<Kbd>{i + 1}</Kbd>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs hidden sm:inline-flex" onClick={() => setPaletteOpen(true)} aria-label="Open command palette (Ctrl+K)">
              <span className="text-muted-foreground">commands</span>
              <Kbd><IconCommand className="size-3" />k</Kbd>
            </Button>
            <Button variant="default" size="sm" className="sm:hidden" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <IconCommand className="size-4" />
            </Button>

            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} userLevel={userLevel} />
            ) : (
              <Button variant="secondary" size="sm" asChild className="text-xs">
                <Link href="/login">login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 flex-col overflow-y-auto" role="main">
        {children}

        <footer className="text-muted-foreground mt-auto shrink-0" role="contentinfo">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-[11px] sm:justify-start">
          <span className="flex items-center gap-2">
            <a href="https://github.com/CMMhero/zentype" target="_blank" rel="noreferrer" className="hover:text-foreground" aria-label="GitHub">
              <IconCode className="size-4" />
            </a>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/about" className="hover:text-foreground underline underline-offset-2">about</Link>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">terms</Link>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">privacy</Link>
          </span>
          <span className="ml-auto hidden items-center gap-1 sm:flex">
            <Combobox
              items={THEME_FOOTER_ITEMS}
              value={themeId}
              onValueChange={(v) => updateSettings({ themeId: v })}
              placeholder="Theme"
              searchPlaceholder="Search themes…"
              className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
            />
            <Combobox
              items={FONT_FOOTER_ITEMS}
              value={fontFamily}
              onValueChange={(v) => updateSettings({ fontFamily: v as FontFamily })}
              placeholder="Font"
              searchPlaceholder="Search fonts…"
              className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
            />
          </span>
        </div>
      </footer>

        <CommandPalette />
        <HelpDialog />
      </main>

      {/* Mobile bottom nav - normal flow, not fixed */}
      <nav className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="flex h-14 items-center justify-around">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                aria-label={item.label}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className="size-5" stroke={active ? 2 : 1.5} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
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
  { value: "advent-pro", label: "Advent Pro", fontCssVar: "geometric sans" },
  { value: "alfa-slab-one", label: "Alfa Slab One", fontCssVar: "slab display" },
  { value: "anonymous-pro", label: "Anonymous Pro", fontCssVar: "typewriter mono" },
  { value: "archivo", label: "Archivo", fontCssVar: "grotesque sans" },
  { value: "asap", label: "Asap", fontCssVar: "geometric sans" },
  { value: "atkinson-hyperlegible", label: "Atkinson Hyperlegible", fontCssVar: "dyslexic-friendly" },
  { value: "baloo-2", label: "Baloo 2", fontCssVar: "rounded sans" },
  { value: "barlow", label: "Barlow", fontCssVar: "neo-grotesk sans" },
  { value: "bitter", label: "Bitter", fontCssVar: "slab serif" },
  { value: "bricolage-grotesque", label: "Bricolage Grotesque", fontCssVar: "variable grotesk" },
  { value: "cabin", label: "Cabin", fontCssVar: "humanist sans" },
  { value: "cal-sans", label: "Cal Sans", fontCssVar: "geometric display" },
  { value: "cascadia-code", label: "Cascadia Code", fontCssVar: "microsoft mono" },
  { value: "caveat", label: "Caveat", fontCssVar: "handwriting" },
  { value: "chivo", label: "Chivo", fontCssVar: "grotesque sans" },
  { value: "comic-neue", label: "Comic Sans", fontCssVar: "casual cursive" },
  { value: "commit-mono", label: "Commit Mono", fontCssVar: "neutral mono" },
  { value: "comfortaa", label: "Comfortaa", fontCssVar: "rounded sans" },
  { value: "coming-soon", label: "Coming Soon", fontCssVar: "handwriting" },
  { value: "courier-prime", label: "Courier Prime", fontCssVar: "courier variant" },
  { value: "crimson-pro", label: "Crimson Pro", fontCssVar: "old-style serif" },
  { value: "dancing-script", label: "Dancing Script", fontCssVar: "script" },
  { value: "dm-sans", label: "DM Sans", fontCssVar: "geometric sans" },
  { value: "domine", label: "Domine", fontCssVar: "transitional serif" },
  { value: "exo-2", label: "Exo 2", fontCssVar: "geometric sans" },
  { value: "figtree", label: "Figtree", fontCssVar: "geometric sans" },
  { value: "fira-code", label: "Fira Code", fontCssVar: "monospace ligatures" },
  { value: "fira-sans", label: "Fira Sans", fontCssVar: "humanist sans" },
  { value: "fredoka", label: "Fredoka", fontCssVar: "rounded sans" },
  { value: "geist", label: "Geist", fontCssVar: "variable sans" },
  { value: "geist-mono", label: "Geist Mono", fontCssVar: "variable mono" },
  { value: "gelasio", label: "Gelasio", fontCssVar: "Georgia variant" },
  { value: "google-sans", label: "Google Sans", fontCssVar: "google sans" },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", fontCssVar: "ibm mono" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", fontCssVar: "ibm sans" },
  { value: "inconsolata", label: "Inconsolata", fontCssVar: "condensed mono" },
  { value: "inter", label: "Inter", fontCssVar: "variable sans" },
  { value: "itim", label: "Itim", fontCssVar: "casual sans" },
  { value: "iosevka", label: "Iosevka", fontCssVar: "code ligature mono" },
  { value: "jetbrains-mono", label: "JetBrains Mono", fontCssVar: "code mono" },
  { value: "josefin-sans", label: "Josefin Sans", fontCssVar: "geometric sans" },
  { value: "karla", label: "Karla", fontCssVar: "grotesque sans" },
  { value: "lato", label: "Lato", fontCssVar: "humanist sans" },
  { value: "lexend", label: "Lexend", fontCssVar: "readability sans" },
  { value: "lobster", label: "Lobster", fontCssVar: "display script" },
  { value: "lora", label: "Lora", fontCssVar: "calligraphy serif" },
  { value: "manrope", label: "Manrope", fontCssVar: "grotesque sans" },
  { value: "merriweather", label: "Merriweather", fontCssVar: "sturdy serif" },
  { value: "mona-sans", label: "Mona Sans", fontCssVar: "variable sans" },
  { value: "montserrat", label: "Montserrat", fontCssVar: "geometric sans" },
  { value: "noto-sans", label: "Noto Sans", fontCssVar: "universal sans" },
  { value: "noto-serif", label: "Noto Serif", fontCssVar: "universal serif" },
  { value: "nunito", label: "Nunito", fontCssVar: "rounded sans" },
  { value: "nunito-sans", label: "Nunito Sans", fontCssVar: "rounded sans" },
  { value: "opendyslexic", label: "OpenDyslexic", fontCssVar: "dyslexic-friendly" },
  { value: "open-sans", label: "Open Sans", fontCssVar: "humanist sans" },
  { value: "oswald", label: "Oswald", fontCssVar: "condensed sans" },
  { value: "outfit", label: "Outfit", fontCssVar: "geometric sans" },
  { value: "oxygen", label: "Oxygen", fontCssVar: "humanist sans" },
  { value: "pacifico", label: "Pacifico", fontCssVar: "brush script" },
  { value: "petrona", label: "Petrona", fontCssVar: "old-style serif" },
  { value: "playfair-display", label: "Playfair Display", fontCssVar: "didone serif" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", fontCssVar: "geometric sans" },
  { value: "poppins", label: "Poppins", fontCssVar: "geometric sans" },
  { value: "pt-sans", label: "PT Sans", fontCssVar: "humanist sans" },
  { value: "pt-serif", label: "PT Serif", fontCssVar: "transitional serif" },
  { value: "quicksand", label: "Quicksand", fontCssVar: "rounded sans" },
  { value: "raleway", label: "Raleway", fontCssVar: "elegant sans" },
  { value: "red-hat-display", label: "Red Hat Display", fontCssVar: "display sans" },
  { value: "red-hat-mono", label: "Red Hat Mono", fontCssVar: "mono" },
  { value: "roboto", label: "Roboto", fontCssVar: "neo-grotesk sans" },
  { value: "roboto-flex", label: "Roboto Flex", fontCssVar: "variable sans" },
  { value: "roboto-mono", label: "Roboto Mono", fontCssVar: "mono" },
  { value: "roboto-slab", label: "Roboto Slab", fontCssVar: "slab serif" },
  { value: "rubik", label: "Rubik", fontCssVar: "rounded sans" },
  { value: "sarabun", label: "Sarabun", fontCssVar: "thai sans" },
  { value: "shantell-sans", label: "Shantell Sans", fontCssVar: "handwriting sans" },
  { value: "sora", label: "Sora", fontCssVar: "geometric sans" },
  { value: "source-code-pro", label: "Source Code Pro", fontCssVar: "code mono" },
  { value: "space-grotesk", label: "Space Grotesk", fontCssVar: "monospace-inspired" },
  { value: "space-mono", label: "Space Mono", fontCssVar: "monospace" },
  { value: "titillium-web", label: "Titillium Web", fontCssVar: "technical sans" },
  { value: "ubuntu", label: "Ubuntu", fontCssVar: "humanist sans" },
  { value: "ubuntu-mono", label: "Ubuntu Mono", fontCssVar: "mono" },
  { value: "urbanist", label: "Urbanist", fontCssVar: "geometric sans" },
  { value: "victor-mono", label: "Victor Mono", fontCssVar: "cursive mono" },
  { value: "work-sans", label: "Work Sans", fontCssVar: "variable sans" },
];

function UserMenu({ user, onSignOut, userLevel }: { user: SessionUser; onSignOut: () => void; userLevel: number | null }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hover:bg-muted h-auto gap-2 rounded-md px-1 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Account menu">
          <Avatar className="size-6">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="rounded text-[10px] uppercase">{user.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-xs sm:inline">{user.username}</span>
          {userLevel !== null ? (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
              {userLevel}
            </span>
          ) : (
            <Skeleton className="hidden sm:inline-flex shrink-0 h-4 w-5 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">
          <div className="flex items-center gap-2">
            <span className="truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}><IconUserFilled className="size-4" /> profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}><IconSettingsFilled className="size-4" /> settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}><IconLogout className="size-4" /> sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
