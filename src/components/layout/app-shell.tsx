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
    <div className="flex min-h-screen flex-col pb-14 md:pb-0">
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
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setPaletteOpen(true)} aria-label="Open command palette (Ctrl+K)">
              <span className="hidden sm:inline text-muted-foreground">commands</span>
              <Kbd><IconCommand className="size-3" />k</Kbd>
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

      <main id="main-content" className="flex flex-1 flex-col" role="main">{children}</main>

      <CommandPalette />
      <HelpDialog />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
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

      <footer className="text-muted-foreground mt-auto" role="contentinfo">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-[11px] sm:justify-start">
          <span className="flex items-center gap-2">
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
  { value: "anonymous-pro", label: "Anonymous Pro", fontCssVar: "var(--font-anonymous-pro)" },
  { value: "archivo", label: "Archivo", fontCssVar: "var(--font-archivo)" },
  { value: "barlow", label: "Barlow", fontCssVar: "var(--font-barlow)" },
  { value: "bricolage-grotesque", label: "Bricolage Grotesque", fontCssVar: "var(--font-bricolage-grotesque)" },
  { value: "bitter", label: "Bitter", fontCssVar: "var(--font-bitter)" },
  { value: "cal-sans", label: "Cal Sans", fontCssVar: "var(--font-cal-sans)" },
  { value: "cabin", label: "Cabin", fontCssVar: "var(--font-cabin)" },
  { value: "cascadia-code", label: "Cascadia Code", fontCssVar: "var(--font-cascadia-code)" },
  { value: "comic-neue", label: "Comic Sans", fontCssVar: "var(--font-comic-neue)" },
  { value: "commit-mono", label: "Commit Mono", fontCssVar: "var(--font-commit-mono)" },
  { value: "crimson-pro", label: "Crimson Pro", fontCssVar: "var(--font-crimson-pro)" },
  { value: "dm-sans", label: "DM Sans", fontCssVar: "var(--font-dm-sans)" },
  { value: "domine", label: "Domine", fontCssVar: "var(--font-domine)" },
  { value: "exo-2", label: "Exo 2", fontCssVar: "var(--font-exo-2)" },
  { value: "fira-code", label: "Fira Code", fontCssVar: "var(--font-fira-code)" },
  { value: "fira-sans", label: "Fira Sans", fontCssVar: "var(--font-fira-sans)" },
  { value: "figtree", label: "Figtree", fontCssVar: "var(--font-figtree)" },
  { value: "geist", label: "Geist", fontCssVar: "var(--font-geist)" },
  { value: "geist-mono", label: "Geist Mono", fontCssVar: "var(--font-geist-mono)" },
  { value: "google-sans", label: "Google Sans", fontCssVar: "var(--font-google-sans)" },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", fontCssVar: "var(--font-ibm-plex-mono)" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", fontCssVar: "var(--font-ibm-plex-sans)" },
  { value: "inconsolata", label: "Inconsolata", fontCssVar: "var(--font-inconsolata)" },
  { value: "inter", label: "Inter", fontCssVar: "var(--font-inter)" },
  { value: "jetbrains-mono", label: "JetBrains Mono", fontCssVar: "var(--font-jetbrains-mono)" },
  { value: "josefin-sans", label: "Josefin Sans", fontCssVar: "var(--font-josefin-sans)" },
  { value: "karla", label: "Karla", fontCssVar: "var(--font-karla)" },
  { value: "lato", label: "Lato", fontCssVar: "var(--font-lato)" },
  { value: "lexend", label: "Lexend", fontCssVar: "var(--font-lexend)" },
  { value: "lora", label: "Lora", fontCssVar: "var(--font-lora)" },
  { value: "manrope", label: "Manrope", fontCssVar: "var(--font-manrope)" },
  { value: "merriweather", label: "Merriweather", fontCssVar: "var(--font-merriweather)" },
  { value: "mona-sans", label: "Mona Sans", fontCssVar: "var(--font-mona-sans)" },
  { value: "montserrat", label: "Montserrat", fontCssVar: "var(--font-montserrat)" },
  { value: "nunito", label: "Nunito", fontCssVar: "var(--font-nunito)" },
  { value: "noto-sans", label: "Noto Sans", fontCssVar: "var(--font-noto-sans)" },
  { value: "noto-serif", label: "Noto Serif", fontCssVar: "var(--font-noto-serif)" },
  { value: "nunito-sans", label: "Nunito Sans", fontCssVar: "var(--font-nunito-sans)" },
  { value: "open-sans", label: "Open Sans", fontCssVar: "var(--font-open-sans)" },
  { value: "oswald", label: "Oswald", fontCssVar: "var(--font-oswald)" },
  { value: "outfit", label: "Outfit", fontCssVar: "var(--font-outfit)" },
  { value: "playfair-display", label: "Playfair Display", fontCssVar: "var(--font-playfair-display)" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", fontCssVar: "var(--font-plus-jakarta-sans)" },
  { value: "poppins", label: "Poppins", fontCssVar: "var(--font-poppins)" },
  { value: "quicksand", label: "Quicksand", fontCssVar: "var(--font-quicksand)" },
  { value: "pt-sans", label: "PT Sans", fontCssVar: "var(--font-pt-sans)" },
  { value: "pt-serif", label: "PT Serif", fontCssVar: "var(--font-pt-serif)" },
  { value: "raleway", label: "Raleway", fontCssVar: "var(--font-raleway)" },
  { value: "red-hat-display", label: "Red Hat Display", fontCssVar: "var(--font-red-hat-display)" },
  { value: "red-hat-mono", label: "Red Hat Mono", fontCssVar: "var(--font-red-hat-mono)" },
  { value: "roboto-flex", label: "Roboto Flex", fontCssVar: "var(--font-roboto-flex)" },
  { value: "roboto-mono", label: "Roboto Mono", fontCssVar: "var(--font-roboto-mono)" },
  { value: "rubik", label: "Rubik", fontCssVar: "var(--font-rubik)" },
  { value: "source-code-pro", label: "Source Code Pro", fontCssVar: "var(--font-source-code-pro)" },
  { value: "sora", label: "Sora", fontCssVar: "var(--font-sora)" },
  { value: "space-grotesk", label: "Space Grotesk", fontCssVar: "var(--font-space-grotesk)" },
  { value: "space-mono", label: "Space Mono", fontCssVar: "var(--font-space-mono)" },
  { value: "titillium-web", label: "Titillium Web", fontCssVar: "var(--font-titillium-web)" },
  { value: "ubuntu-mono", label: "Ubuntu Mono", fontCssVar: "var(--font-ubuntu-mono)" },
  { value: "urbanist", label: "Urbanist", fontCssVar: "var(--font-urbanist)" },
  { value: "victor-mono", label: "Victor Mono", fontCssVar: "var(--font-victor-mono)" },
  { value: "work-sans", label: "Work Sans", fontCssVar: "var(--font-work-sans)" },
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
          {userLevel !== null && (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
              {userLevel}
            </span>
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
