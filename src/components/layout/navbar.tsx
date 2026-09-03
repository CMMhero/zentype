"use client";

import {
  IconCommand,
  IconKeyboard,
  IconKeyboardFilled,
  IconLogout,
  IconSettings,
  IconSettingsFilled,
  IconTrophy,
  IconTrophyFilled,
  IconUser,
  IconUserFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Kbd } from "~/components/ui/kbd";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { useAuth } from "~/components/user-provider";
import { lcGetEntry, lcSet } from "~/lib/client-cache";
import {
  ownPointsKey,
  POINTS_CACHE_TTL,
  PROFILE_FRESH_MS,
  type ProfilePoints,
} from "~/lib/profile-cache";
import type { SessionUser } from "~/lib/types";
import { cn } from "~/lib/utils";
import { signOutFn } from "~/server/auth";
import { useUiStore } from "~/stores/ui-store";

const NAV = [
  { to: "/", label: "test", icon: IconKeyboardFilled, iconOutline: IconKeyboard },
  { to: "/leaderboard", label: "leaderboard", icon: IconTrophyFilled, iconOutline: IconTrophy },
  { to: "/profile", label: "profile", icon: IconUserFilled, iconOutline: IconUser },
  { to: "/settings", label: "settings", icon: IconSettingsFilled, iconOutline: IconSettings },
] as const;

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

function DesktopNavLink({
  item,
  index,
  active,
  presses,
  onRepeatPress,
}: {
  item: (typeof NAV)[number];
  index: number;
  active: boolean;
  presses: Record<string, number>;
  onRepeatPress: (to: string) => void;
}) {
  return (
    <NavigationMenuItem key={item.to}>
      <Tooltip>
        <TooltipTrigger
          render={
            <NavigationMenuLink
              className={cn(
                "rounded-2xl p-1.5 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/30",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              render={
                <Link
                  href={item.to}
                  aria-label={item.label}
                  onClick={(e) => {
                    if (active) {
                      e.preventDefault();
                      onRepeatPress(item.to);
                    }
                  }}
                />
              }
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <item.icon
                  key={active ? `pop-${presses[item.to] ?? 0}` : "idle"}
                  className={cn(
                    "size-5 text-primary transition-all duration-300 ease-out",
                    active ? "zt-icon-pop opacity-100" : "absolute opacity-0",
                  )}
                />
                <item.iconOutline
                  className={cn(
                    "size-5",
                    active
                      ? "absolute opacity-0"
                      : "transition-all duration-300 ease-out opacity-100",
                  )}
                />
              </span>
            </NavigationMenuLink>
          }
        />
        <TooltipContent side="bottom" showArrow={false} className="flex items-center gap-1.5">
          {item.label}
          <Kbd>alt</Kbd>+<Kbd>{index + 1}</Kbd>
        </TooltipContent>
      </Tooltip>
    </NavigationMenuItem>
  );
}

/** Floating pill dock — an icon-rail used as the "wings" around the brand. */
function DesktopDock({
  className,
  items,
  pathname,
  presses,
  onRepeatPress,
}: {
  className?: string;
  items: { item: (typeof NAV)[number]; index: number }[];
  pathname: string;
  presses: Record<string, number>;
  onRepeatPress: (to: string) => void;
}) {
  return (
    <NavigationMenu
      aria-label="Primary"
      viewport={false}
      className={cn(
        "min-w-0 items-center rounded-full bg-card px-1.5 py-1 shadow-md ring-1 ring-foreground/5",
        className,
      )}
    >
      <NavigationMenuList className="flex items-center gap-0.5">
        {items.map(({ item, index }) => {
          const active = isActive(pathname, item.to);
          return (
            <DesktopNavLink
              key={item.to}
              item={item}
              index={index}
              active={active}
              presses={presses}
              onRepeatPress={onRepeatPress}
            />
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function Navbar() {
  const { user, status: authStatus, refresh: refreshUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);
  const [presses, setPresses] = useState<Record<string, number>>({});
  const [userLevel, setUserLevel] = useState<number | null>(null);
  useEffect(() => {
    if (!user) {
      setUserLevel(null);
      return;
    }
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
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSignOut() {
    await signOutFn();
    // Drop the client-side user so the header updates without a reload
    await refreshUser();
    toast.success("signed out");
    router.push("/");
  }

  const repeatPress = (to: string) => {
    setPresses((p) => ({ ...p, [to]: (p[to] ?? 0) + 1 }));
    window.dispatchEvent(new Event("zt:restart"));
  };

  return (
    <header
      className="bg-background/80 sticky top-0 z-40 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div
        className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4 md:grid md:grid-cols-[1fr_minmax(0,auto)_1fr] md:gap-0 md:px-6"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Brand — left on mobile, dead-center on desktop */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 md:col-start-2 md:row-start-1 md:justify-self-center"
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

        {/* Left wing dock — desktop only */}
        <DesktopDock
          className="hidden md:flex md:col-start-1 md:row-start-1 md:justify-self-start"
          items={NAV.map((item, index) => ({ item, index })).slice(0, 2)}
          pathname={pathname}
          presses={presses}
          onRepeatPress={repeatPress}
        />

        <div className="ml-auto flex items-center gap-2 md:col-start-3 md:row-start-1 md:ml-0 md:justify-self-end">
          {/* Right wing dock — desktop only */}
          <DesktopDock
            className="hidden md:flex"
            items={NAV.map((item, index) => ({ item, index })).slice(2)}
            pathname={pathname}
            presses={presses}
            onRepeatPress={repeatPress}
          />

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs hidden sm:inline-flex"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (Ctrl+K)"
          >
            <span className="text-muted-foreground">commands</span>
            <Kbd>{isMac ? "cmd" : "ctrl"} k</Kbd>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="sm:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <IconCommand className="size-4" />
          </Button>

          {authStatus === "loading" ? (
            <Skeleton className="h-8 w-9 rounded-3xl sm:h-8 sm:w-20" />
          ) : user ? (
            <UserMenu user={user} onSignOut={handleSignOut} userLevel={userLevel} />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              render={<Link href="/login" />}
              className="text-xs"
            >
              sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Mobile bottom navigation - normal flow, not fixed. */
export function MobileNav() {
  const pathname = usePathname();
  const [presses, setPresses] = useState<Record<string, number>>({});
  return (
    <NavigationMenu
      aria-label="Mobile navigation"
      viewport={false}
      className="bg-background/95 sticky bottom-0 z-40 flex-none border-t border-border/40 backdrop-blur-xl max-w-full md:hidden w-full"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <NavigationMenuList className="flex h-16 w-full items-center justify-between">
        {NAV.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <NavigationMenuItem key={item.to}>
              <NavigationMenuLink
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-colors",
                  !active && "hover:bg-muted",
                )}
                render={
                  <Link
                    href={item.to}
                    aria-label={item.label}
                    onClick={(e) => {
                      // Pressing the already-active tab replays the icon "pop".
                      if (active) {
                        e.preventDefault();
                        setPresses((p) => ({ ...p, [item.to]: (p[item.to] ?? 0) + 1 }));
                      }
                    }}
                  />
                }
              >
                <span className="relative flex items-center justify-center rounded-full px-5 py-1">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-full bg-primary/10",
                      active
                        ? "zt-pill-pop"
                        : "scale-0 opacity-0 transition-all duration-300 ease-out",
                    )}
                  />
                  <item.icon
                    key={active ? `pop-${presses[item.to] ?? 0}` : "idle"}
                    className={cn(
                      "relative size-5 text-primary transition-all duration-300 ease-out",
                      active ? "zt-icon-pop opacity-100" : "absolute opacity-0",
                    )}
                  />
                  <item.iconOutline
                    className={cn(
                      "relative size-5 text-foreground",
                      // Hide instantly on activation (no transition) so the tab
                      // press feels immediate; keep the fade-in when returning
                      // to the inactive state.
                      active
                        ? "absolute opacity-0"
                        : "transition-all duration-300 ease-out opacity-100",
                    )}
                  />
                </span>
                <span className={cn("text-[10px] text-foreground", active && "font-bold")}>
                  {item.label}
                </span>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function UserMenu({
  user,
  onSignOut,
  userLevel,
}: {
  user: SessionUser;
  onSignOut: () => void;
  userLevel: number | null;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto gap-2 rounded-3xl px-1.5 py-1"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-6">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback className="rounded-full text-[10px] uppercase">
            {user.username.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-24 truncate text-xs sm:inline">{user.username}</span>
        {userLevel === null ? (
          <Skeleton className="hidden h-[18px] min-w-[28px] rounded-full sm:block" />
        ) : (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex text-[9px] font-bold tracking-widest"
          >
            {userLevel}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">
          <div className="flex items-center gap-2">
            <span className="truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <IconUserFilled className="size-4" /> profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <IconSettingsFilled className="size-4" /> settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <IconLogout className="size-4" /> sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
