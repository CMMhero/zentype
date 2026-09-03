"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("~/components/layout/command-palette").then(m => m.CommandPalette), {
  ssr: false,
  loading: () => null,
});
const HelpDialog = dynamic(() => import("~/components/layout/help-dialog").then(m => m.HelpDialog), { ssr: false });
import {
  IconCommand, IconKeyboardFilled, IconLogout,
  IconSettingsFilled, IconTrophyFilled, IconUserFilled,
  IconCode,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { FONTS } from "~/lib/fonts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import { Badge } from "~/components/ui/badge";
import { Skeleton, SelectSkeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { ComboboxSelect, type ComboboxSelectOption } from "~/components/ui/combobox";
import { lcGetEntry, lcSet } from "~/lib/client-cache";
import {
  ownPointsKey, POINTS_CACHE_TTL, PROFILE_FRESH_MS,
  type ProfilePoints,
} from "~/lib/profile-cache";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";
import { signOutFn } from "~/server/auth";
import { THEMES, getTheme } from "~/lib/themes";
import { cn } from "~/lib/utils";
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
  const settingsHydrated = useSettingsStore((s) => s.hasHydrated);
  const updateSettings = useSettingsStore((s) => s.update);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  useEffect(() => {
    if (!user) { setUserLevel(null); return; }
    // Read the shared points cache (the profile page writes it) so the badge
    // renders instantly and skips the network fetch entirely while it's fresh.
    const entry = lcGetEntry<ProfilePoints>(ownPointsKey(user.id), POINTS_CACHE_TTL);
    if (entry) {
      setUserLevel(entry.data.level);
      if (entry.ageMs < PROFILE_FRESH_MS) return; // fresh — skip refetch
    }
    let cancelled = false;
    void import("~/server/gamification").then(({ getUserPoints }) =>
      getUserPoints().then((p) => {
        if (cancelled || !p) return;
        setUserLevel(p.level);
        // Write through to the shared cache so the profile page benefits too
        lcSet(ownPointsKey(user.id), p);
      })
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
    toast.success("signed out");
    router.push("/");
  }

  return (
    <div className="flex h-dvh flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="bg-background/80 sticky top-0 z-40 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" role="banner">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
                      className={cn(
                        "rounded-3xl p-1.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
                        active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
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
              <Kbd>{isMac ? "cmd": "ctrl"} k</Kbd>
            </Button>
            <Button variant="default" size="sm" className="sm:hidden" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <IconCommand className="size-4" />
            </Button>

            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} userLevel={userLevel} />
            ) : (
              <Button variant="secondary" size="sm" asChild className="text-xs">
                <Link href="/login">sign in</Link>
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
            <Link href="/about" className="hover:text-foreground underline underline-offset-2">about</Link>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">terms</Link>
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">privacy</Link>
          </span>
          <span className="ml-auto hidden items-center gap-1 sm:flex">
            {settingsHydrated ? (
              <>
                <ComboboxSelect
                  items={THEME_FOOTER_ITEMS}
                  value={themeId}
                  onValueChange={(v) => updateSettings({ themeId: v })}
                  placeholder="theme"
                  searchPlaceholder="search themes…"
                  className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
                />
                <ComboboxSelect
                  items={FONT_FOOTER_ITEMS}
                  value={fontFamily}
                  onValueChange={(v) => updateSettings({ fontFamily: v as FontFamily })}
                  placeholder="font"
                  searchPlaceholder="search fonts…"
                  className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
                />
              </>
            ) : (
              <>
                {/* Settings not loaded yet — don't show the default theme/font */}
                <SelectSkeleton className="h-7 w-16 px-2" />
                <SelectSkeleton className="h-7 w-14 px-2" />
              </>
            )}
          </span>
        </div>
      </footer>

        <CommandPalette />
        <HelpDialog />
      </main>

      {/* Mobile bottom nav - normal flow, not fixed */}
      <nav className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="flex h-14 items-center justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
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

const THEME_FOOTER_ITEMS: ComboboxSelectOption[] = [...THEMES]
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((t) => ({
    value: t.id,
    label: t.label,
    leading: (
      <span className="flex shrink-0 gap-0.5">
        <span className="size-3 rounded-sm border border-border/50" style={{ background: t.vars["--background"] }} />
        <span className="size-3 rounded-sm" style={{ background: t.vars["--primary"] }} />
        <span className="size-3 rounded-sm" style={{ background: t.vars["--secondary"] }} />
      </span>
    ),
  }));

const FONT_FOOTER_ITEMS: ComboboxSelectOption[] = FONTS.map((f) => ({
  value: f.value,
  label: f.label,
  fontCssVar: f.cssVar,
}));

function UserMenu({ user, onSignOut, userLevel }: { user: SessionUser; onSignOut: () => void; userLevel: number | null }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 rounded-3xl px-1.5 py-1" aria-label="Account menu">
          <Avatar className="size-6">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="rounded-full text-[10px] uppercase">{user.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-xs sm:inline">{user.username}</span>
          {userLevel === null ? (
            <Skeleton className="hidden h-[18px] min-w-[28px] rounded-full sm:block" />
          ) : (
            <Badge variant="secondary" className="hidden sm:inline-flex text-[9px] font-bold tracking-widest">
              {userLevel}
            </Badge>
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
