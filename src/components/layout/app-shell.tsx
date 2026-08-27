"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Command as CommandIcon, History, Keyboard, LayoutDashboard, LogOut, Settings, Trophy, User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";
import { signOutFn } from "~/server/auth";
import { getTheme } from "~/lib/themes";
import { useGlobalHotkeys } from "~/hooks/use-global-hotkeys";
import { useUser } from "~/components/user-provider";
import type { SessionUser } from "~/lib/types";

const NAV = [
  { to: "/", label: "test", icon: Keyboard },
  { to: "/leaderboard", label: "leaderboard", icon: Trophy },
  { to: "/profile", label: "profile", icon: LayoutDashboard },
  { to: "/history", label: "history", icon: History },
  { to: "/settings", label: "settings", icon: Settings },
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
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const flipColors = useSettingsStore((s) => s.settings.flipColors);

  useGlobalHotkeys();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-appearance", getTheme(themeId).appearance);
    root.setAttribute("data-flip", String(flipColors));
  }, [themeId, flipColors]);

  async function handleSignOut() {
    await signOutFn();
    toast.success("signed out");
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border/60 bg-background/95 sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight">
            <span className="text-sm">zentype<span className="text-muted-foreground"> v2</span></span>
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
              <CommandIcon className="size-3" />
              <span className="hidden sm:inline text-muted-foreground">commands</span>
              <Kbd>⌘k</Kbd>
            </Button>

            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <Button variant="secondary" size="sm" asChild className="text-xs">
                <Link href="/login">login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-border/60 bg-secondary/40 text-muted-foreground mt-8 border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              {user ? `[${user.username}]` : "[guest]"}
            </Badge>
          </span>
          <span className="hidden sm:inline"><Kbd>tab</Kbd> restart · <Kbd>?</Kbd> shortcuts</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-muted-foreground/60">v{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "2.0.0"}</span>
            <span className="inline-block size-2 rounded-full bg-primary/80" />
            {themeId.replace(/_/g, "-")}
          </span>
        </div>
      </footer>
    </div>
  );
}

function UserMenu({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
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
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs"><div className="truncate">{user.email}</div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}><User /> profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/history")}><History /> history</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}><Settings /> settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}><LogOut /> sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
