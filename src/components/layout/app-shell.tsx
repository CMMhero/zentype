"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCommand, IconKeyboard, IconLayoutDashboard,
  IconLogout, IconPalette, IconSettings, IconTrophy, IconTypography, IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger } from "~/components/ui/select";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";
import { signOutFn } from "~/server/auth";
import { THEMES, getTheme } from "~/lib/themes";
import { useGlobalHotkeys } from "~/hooks/use-global-hotkeys";
import { useSettingsSync } from "~/hooks/use-settings-sync";
import { useUser } from "~/components/user-provider";
import type { FontFamily, SessionUser } from "~/lib/types";

const NAV = [
  { to: "/", label: "test", icon: IconKeyboard },
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
      <header className="border-border/40 bg-background/80 sticky top-0 z-40 border-b shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Zentype home">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-primary size-5">
              <path fill="currentColor" d="M20 5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM6 13a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1m12 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1m-7.998 0a1 1 0 0 0-.004 2l4 .01a1 1 0 0 0 .005-2zM6 9a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1" />
            </svg>
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
              <IconCommand className="size-3" />
              <span className="hidden sm:inline text-muted-foreground">commands</span>
              <Kbd>⌘k</Kbd>
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

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="text-muted-foreground mt-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[11px]">
          <span className="flex items-center gap-2">
            <span>Made by <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-2">CMMhero</a></span>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-2">Terms</Link>
            <span className="text-muted-foreground/50">·</span>
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy</Link>
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Select value={themeId} onValueChange={(v) => updateSettings({ themeId: v })}>
              <SelectTrigger size="sm" className="h-7 w-auto gap-1.5 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]">
                <IconPalette className="size-3.5 opacity-60" />
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <span className="inline-flex gap-0.5" aria-hidden>
                    <span className="size-3 rounded-sm border border-border" style={{ background: getTheme(themeId).vars["--background"] }} />
                    <span className="size-3 rounded-sm" style={{ background: getTheme(themeId).vars["--primary"] }} />
                  </span>
                  {getTheme(themeId).label}
                </span>
              </SelectTrigger>
              <SelectContent>
                {[...THEMES].sort((a, b) => a.label.localeCompare(b.label)).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex gap-0.5" aria-hidden>
                        <span className="size-3 rounded-sm border border-border" style={{ background: t.vars["--background"] }} />
                        <span className="size-3 rounded-sm" style={{ background: t.vars["--primary"] }} />
                      </span>
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fontFamily} onValueChange={(v) => updateSettings({ fontFamily: v as FontFamily })}>
              <SelectTrigger size="sm" className="h-7 w-auto gap-1.5 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]">
                <IconTypography className="size-3.5 opacity-60" />
                <span className="hidden sm:inline" style={{ fontFamily: `var(--font-${fontFamily})` }}>{FONT_LABELS[fontFamily]}</span>
              </SelectTrigger>
              <SelectContent>
                {FONT_ENTRIES.map(([slug, name]) => (
                  <SelectItem key={slug} value={slug} className="text-xs">
                    <span style={{ fontFamily: `var(--font-${slug})` }}>{name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        </div>
      </footer>
    </div>
  );
}

const FONT_LABELS: Record<string, string> = {
  "anonymous-pro": "Anonymous Pro",
  "barlow": "Barlow",
  "bitter": "Bitter",
  "cabin": "Cabin",
  "cascadia-code": "Cascadia Code",
  "commit-mono": "Commit Mono",
  "crimson-pro": "Crimson Pro",
  "dm-sans": "DM Sans",
  "exo-2": "Exo 2",
  "fira-code": "Fira Code",
  "geist-mono": "Geist Mono",
  "ibm-plex-mono": "IBM Plex Mono",
  "ibm-plex-sans": "IBM Plex Sans",
  "inconsolata": "Inconsolata",
  "inter": "Inter",
  "jetbrains-mono": "JetBrains Mono",
  "josefin-sans": "Josefin Sans",
  "lato": "Lato",
  "lexend": "Lexend",
  "lora": "Lora",
  "manrope": "Manrope",
  "merriweather": "Merriweather",
  "montserrat": "Montserrat",
  "noto-sans": "Noto Sans",
  "noto-serif": "Noto Serif",
  "nunito-sans": "Nunito Sans",
  "open-sans": "Open Sans",
  "oswald": "Oswald",
  "outfit": "Outfit",
  "playfair-display": "Playfair Display",
  "plus-jakarta-sans": "Plus Jakarta Sans",
  "poppins": "Poppins",
  "pt-sans": "PT Sans",
  "pt-serif": "PT Serif",
  "raleway": "Raleway",
  "roboto-flex": "Roboto Flex",
  "roboto-mono": "Roboto Mono",
  "source-code-pro": "Source Code Pro",
  "space-grotesk": "Space Grotesk",
  "space-mono": "Space Mono",
  "titillium-web": "Titillium Web",
  "ubuntu-mono": "Ubuntu Mono",
  "victor-mono": "Victor Mono",
  "work-sans": "Work Sans",
} as const;
const FONT_ENTRIES = Object.entries(FONT_LABELS);

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
