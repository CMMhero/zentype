"use client";

import {
  IconArrowRight,
  IconAt,
  IconAward,
  IconChartBar,
  IconClock,
  IconCrown,
  IconEye,
  IconGauge,
  IconHash,
  IconHistory,
  IconLink,
  IconStopwatch,
  IconTarget,
  IconTrendingUp,
  IconTrophy,
  IconUserFilled,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AchievementGrid } from "~/components/ui/achievement-grid";
import { AchievementList } from "~/components/ui/achievement-list";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SelectSkeleton, Skeleton } from "~/components/ui/skeleton";
import { StreakCalendar, StreakCalendarSkeleton } from "~/components/ui/streak-calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const WpmChart = dynamic(() => import("~/components/charts/wpm-chart").then((m) => m.WpmChart), {
  ssr: false,
  loading: () => <Skeleton className="h-40 sm:h-56 w-full" />,
});

import { useAuthStatus, useUser } from "~/components/user-provider";
import { ACHIEVEMENTS } from "~/lib/achievements";
import { lcDel, lcGet, lcGetEntry, lcSet } from "~/lib/client-cache";
import {
  isFresh,
  ownAchKey,
  ownJoinKey,
  ownPointsKey,
  ownRanksKey,
  ownResultsKey,
  ownStatsKey,
  PROFILE_CACHE_TTL,
  PROFILE_FRESH_MS,
  RESULT_DETAIL_TTL,
  readOwnProfileCache,
  toPublicProfile,
  writePublicProfileCache,
} from "~/lib/profile-cache";
import { modeLabel, type TestResult } from "~/lib/types";
import { cn, formatDateTime } from "~/lib/utils";
import { getUserAchievements, getUserPoints } from "~/server/gamification";
import { getBoardRanks } from "~/server/leaderboard";
import {
  type AggregatedStats,
  getMyJoinDate,
  getResultById,
  getUserResults,
  getUserStats,
} from "~/server/results";
import ProfileLoading from "./loading";

/** All board keys in display order */
const ALL_BOARDS = [
  "time:15",
  "time:30",
  "time:60",
  "time:120",
  "words:10",
  "words:25",
  "words:50",
  "words:100",
] as const;

const wpmConfig = {
  wpm: { label: "wpm", color: "var(--chart-1)" },
  avg: { label: "avg", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const accConfig = {
  accuracy: { label: "accuracy", color: "var(--chart-2)" },
  avgAcc: { label: "avg", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const distConfig = {
  count: { label: "tests", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [points, setPoints] = useState<{ totalXP: number; level: number; progress: number } | null>(
    null,
  );
  const [achievements, setAchievements] = useState<Array<{
    id: string;
    name: string;
    description: string;
    trigger: "metric" | "streak" | "api";
    achievedAt: string | null;
    progress: number;
    xp: number;
  }> | null>(null);
  const [selected, setSelected] = useState<TestResult | null>(null);
  const [achOpen, setAchOpen] = useState(false);
  const [achTab, setAchTab] = useState<"all" | "unlocked" | "locked">("all");
  const [streakYear, setStreakYear] = useState<number | "last12">("last12");
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(10);
  const [boardRanks, setBoardRanks] = useState<Record<string, number> | null>(null);
  // Tracks the results currently rendered, so a background refetch can tell
  // whether the UI would actually change before calling setResults. Prevents
  // the cached -> 10 results -> full results flash.
  const resultsRef = useRef<TestResult[] | null>(null);
  const authStatus = useAuthStatus();

  // Hydrate from localStorage before the first paint, so a refresh or
  // navigation renders cached data immediately instead of flashing skeletons.
  useLayoutEffect(() => {
    const uid = user?.id ?? "anon";
    const c = readOwnProfileCache(uid);
    if (c.stats) setStats(c.stats.data);
    if (c.results) {
      resultsRef.current = c.results.data;
      setResults(c.results.data);
    }
    if (c.points) setPoints(c.points.data);
    if (c.achievements) setAchievements(c.achievements.data);
    if (c.joinDate) setJoinedAt(c.joinDate.data);
    const ranks = lcGetEntry<Record<string, number>>(ownRanksKey(uid), PROFILE_CACHE_TTL);
    if (ranks) setBoardRanks(ranks.data);
  }, [user?.id]);

  // Stale-while-revalidate: show cached data instantly, fetch fresh in background.
  // The own and public profile views share the same cache keys, so toggling
  // between them never refetches while the cache is still fresh.
  useEffect(() => {
    // Wait for the client-side session to settle so we never fetch or cache
    // under the "anon" placeholder key, then re-run once the real user lands.
    if (authStatus !== "ready") return;
    let cancelled = false;
    // Namespace cache keys by user ID to prevent cross-user data leakage
    const uid = user?.id ?? "anon";
    const username = user?.username ?? null;
    // Clean up old non-namespaced keys from before this fix
    [
      "profile-stats",
      "profile-results",
      "profile-points",
      "profile-achievements",
      "profile-join-date",
    ].forEach((k) => {
      lcDel(k);
    });

    const c = readOwnProfileCache(uid);

    // Warm the public-profile cache so "view public profile" renders instantly
    if (username && c.stats && c.results && c.joinDate) {
      writePublicProfileCache(username, {
        profile: toPublicProfile({
          userId: uid,
          username,
          avatarUrl: user?.avatarUrl ?? null,
          joinedAt: c.joinDate.data,
          stats: c.stats.data,
          results: c.results.data,
        }),
      });
    }
    if (username && c.points) writePublicProfileCache(username, { points: c.points.data });
    if (username && c.achievements)
      writePublicProfileCache(username, { achievements: c.achievements.data });

    // Everything is fresh — skip the refetch entirely (fast profile ↔ public toggle)
    if (
      isFresh(c.stats) &&
      isFresh(c.results) &&
      isFresh(c.points) &&
      isFresh(c.achievements) &&
      isFresh(c.joinDate)
    ) {
      return () => {
        cancelled = true;
      };
    }

    // Fast fetch: stats + 10 results for quick initial render
    void Promise.all([
      getUserStats(),
      getUserResults({ limit: 10, lite: true }),
      user ? getUserPoints() : Promise.resolve(null),
      user ? getUserAchievements() : Promise.resolve(null),
      user ? getMyJoinDate() : Promise.resolve(null),
    ]).then(([s, r, p, a, j]) => {
      if (cancelled) return;
      if (s) {
        setStats(s);
        lcSet(ownStatsKey(uid), s);
      }
      if (r) {
        // Results already rendered from cache? Don't swap in the partial
        // 10-result batch — that would flash the UI. The full batch below is
        // the only thing that updates results once data is on screen.
        if (resultsRef.current === null) {
          resultsRef.current = r;
          setResults(r);
        }
      }
      if (p) {
        setPoints(p);
        lcSet(ownPointsKey(uid), p);
      }
      if (a) {
        setAchievements(a);
        lcSet(ownAchKey(uid), a);
      }
      if (j) {
        setJoinedAt(j);
        lcSet(ownJoinKey(uid), j);
      }
      // Warm the public cache with fresh data too. The public profile object
      // is only written by the full batch below — writing the partial
      // 10-result profile here could downgrade a cached full profile and
      // flash the public view mid-refresh.
      if (username) {
        if (p) writePublicProfileCache(username, { points: p });
        if (a) writePublicProfileCache(username, { achievements: a });
      }
      // Background: fetch full results for accurate charts, PBs, and streaks
      void getUserResults({ limit: 200, lite: true }).then((full) => {
        if (cancelled || !full) return;
        // Revalidation that returns identical data must not cause a visible
        // re-render — keep showing what's already on screen.
        if (!resultsEqual(full, resultsRef.current)) {
          resultsRef.current = full;
          setResults(full);
        }
        lcSet(ownResultsKey(uid), full);
        if (username && s && j) {
          writePublicProfileCache(username, {
            profile: toPublicProfile({
              userId: uid,
              username,
              avatarUrl: user?.avatarUrl ?? null,
              joinedAt: j,
              stats: s,
              results: full,
            }),
          });
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user, authStatus]);

  // Board ranks depend on stats (use latest from state, whether cached or fresh)
  useEffect(() => {
    if (!user || !stats) return;
    const boards = Object.keys(stats.bestByBoard);
    if (boards.length === 0) return;
    const key = ownRanksKey(user.id);
    const cached = lcGetEntry<Record<string, number>>(key, PROFILE_CACHE_TTL);
    if (cached) {
      setBoardRanks(cached.data);
      if (cached.ageMs < PROFILE_FRESH_MS) return; // fresh — skip refetch
    }
    void getBoardRanks(user.id, boards).then((ranks) => {
      setBoardRanks(ranks);
      lcSet(key, ranks);
      // Keep the public-profile view warm too
      if (user.username) writePublicProfileCache(user.username, { ranks });
    });
  }, [user, stats]);

  useEffect(() => {
    // Only redirect once the client-side session has settled, so a logged-in
    // user isn't bounced to /login while auth is still resolving.
    if (authStatus === "ready" && !user) {
      router.push("/login");
    }
  }, [user, authStatus, router]);

  if (!user) {
    // While the client-side session is still resolving, mirror the route
    // loading skeleton so a refresh doesn't flash a blank page.
    return authStatus === "loading" ? <ProfileLoading /> : null;
  }

  const loading = stats === null;
  // Results arrive separately from stats (e.g. when coming from the public
  // profile, whose cache has no history) — skeleton until they load rather
  // than showing a wrong "no data" empty state.
  const resultsLoading = results === null;
  const chartData = (results ?? []).slice(0, 100).reverse();

  // Streak data
  const dayMap = new Map<string, number>();
  for (const r of results ?? []) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const sortedDays = Array.from(dayMap.keys()).sort();
  let currentStreak = 0;
  const today = new Date();
  const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (true) {
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (dayMap.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  let longestStreak = currentStreak;
  let run = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1;
      continue;
    }
    const prev = new Date(sortedDays[i - 1]);
    const cur = new Date(sortedDays[i]);
    if (Math.abs((cur.getTime() - prev.getTime()) / 86400000 - 1) < 0.5) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
  }
  const streakPeriods = sortedDays.map((d) => ({ periodStart: d, periodEnd: d }));
  const countsRecord = Object.fromEntries(dayMap.entries()) as Record<string, number>;
  const availableYears = Array.from(
    new Set([...sortedDays.map((d) => Number(d.slice(0, 4))), new Date().getFullYear()]),
  ).sort((a, b) => b - a);
  const totalTestsInStreakPeriod =
    streakYear === "last12"
      ? (() => {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - 364);
          const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
          let total = 0;
          for (const [k, v] of dayMap) if (k >= startKey) total += v;
          return total;
        })()
      : Array.from(dayMap.entries())
          .filter(([k]) => k.startsWith(String(streakYear)))
          .reduce((a, [, v]) => a + v, 0);

  const unlockedAch = (achievements ?? []).filter((a) => a.achievedAt !== null);
  const allAch =
    achievements ??
    ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      trigger: a.trigger,
      achievedAt: null as string | null,
      progress: 0,
      xp: a.xp,
    }));
  const filteredAch =
    achTab === "unlocked"
      ? allAch.filter((a) => a.achievedAt !== null)
      : achTab === "locked"
        ? allAch.filter((a) => a.achievedAt === null)
        : allAch;

  const pbIds = (() => {
    const best = new Map<string, { id: string; wpm: number; acc: number }>();
    for (const r of results ?? []) {
      const k = `${r.mode}:${r.variant}`;
      const cur = best.get(k);
      if (!cur || r.wpm > cur.wpm || (r.wpm === cur.wpm && r.accuracy > cur.acc)) {
        best.set(k, { id: r.id, wpm: r.wpm, acc: r.accuracy });
      }
    }
    return new Set(Array.from(best.values()).map((v) => v.id));
  })();
  const visibleHistory = (results ?? []).slice(0, historyCount);

  const wpmWithAvgData = (() => {
    let sum = 0;
    return chartData.map((r, i) => {
      sum += r.wpm;
      return { n: i + 1, wpm: r.wpm, avg: Math.round(sum / (i + 1)) };
    });
  })();
  const accWithAvgData = (() => {
    let sum = 0;
    return chartData.map((r, i) => {
      sum += r.accuracy;
      return { n: i + 1, accuracy: r.accuracy, avgAcc: Math.round(sum / (i + 1)) };
    });
  })();
  const distributionData = (() => {
    const buckets = new Map<string, number>();
    const BUCKET = 10;
    for (const r of chartData) {
      const start = Math.floor(r.wpm / BUCKET) * BUCKET;
      const label = `${start}-${start + BUCKET - 1}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .map(([range, count]) => ({ range, count, start: Number(range.split("-")[0]) }))
      .sort((a, b) => a.start - b.start)
      .map(({ range, count }) => ({ range, count }));
  })();

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8"
      role="main"
      aria-label="User profile"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconUserFilled className="text-primary size-5" /> profile
        </h1>
        {user && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground gap-2 text-xs"
              asChild
            >
              <Link href={`/profile/${user.username}`}>
                <IconEye className="size-3.5" />{" "}
                <span className="hidden sm:inline">view public profile</span>
                <span className="sm:hidden">public</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground gap-2 text-xs"
              onClick={async () => {
                const url = `${window.location.origin}/profile/${user.username}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("public profile link copied");
                } catch {
                  toast.error("Failed to copy link");
                }
              }}
            >
              <IconLink className="size-3.5" /> <span className="hidden sm:inline">copy link</span>
              <span className="sm:hidden">copy</span>
            </Button>
          </div>
        )}
      </header>
      {/* Level card + stat cards */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        {/* Level card — 2-row layout: avatar+username, then level/XP */}
        <Card className="row-span-2 gap-3 py-3">
          <CardContent className="px-5 pt-2">
            {/* Row 1: Avatar + Username */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 shrink-0 border-2 border-primary/30">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback className="rounded-full text-xl font-bold uppercase">
                  {user.username.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{user.username}</h1>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {joinedAt && (
                  <p className="text-[10px] text-muted-foreground/70">
                    joined{" "}
                    {new Date(joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            {/* Row 2: Level/XP bar — compact single row */}
            {user && points === null ? (
              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ) : points && points.totalXP > 0 ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-lg font-bold tabular-nums text-primary">
                  Lv. {points.level}
                </span>
                <Progress
                  value={points.progress}
                  className="h-1.5 flex-1 bg-muted/80"
                  indicatorClassName="bg-gradient-to-r from-primary/80 to-primary shadow-sm shadow-primary/30 transition-all"
                />
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                  {points.totalXP.toLocaleString()} XP
                </span>
              </div>
            ) : (
              <p className="mt-4 text-[10px] text-muted-foreground">finish tests to earn xp</p>
            )}
          </CardContent>
        </Card>

        {/* 2x2 stat grid — same height as profile card */}
        <div className="grid grid-cols-2 gap-3 row-span-2">
          <StatCard
            icon={<IconTrendingUp className="size-4" />}
            label="avg wpm (last 10)"
            value={loading ? null : String(stats?.avgWpm10 ?? 0)}
          />
          <StatCard
            icon={<IconGauge className="size-4" />}
            label="avg wpm (all)"
            value={loading ? null : String(stats?.avgWpmAll ?? 0)}
          />
          <StatCard
            icon={<IconTarget className="size-4" />}
            label="avg accuracy"
            value={loading ? null : `${stats?.avgAccuracy ?? 0}%`}
          />
          <StatCard
            icon={<IconStopwatch className="size-4" />}
            label="time typed"
            value={loading ? null : formatDuration(stats?.timeTypedSeconds ?? 0)}
          />
        </div>
      </div>

      {/* Personal bests */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconTrophy className="size-4" /> personal bests
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {ALL_BOARDS.map((board) => {
              const wpm = stats?.bestByBoard?.[board];
              const rank = boardRanks?.[board];
              return (
                <Card
                  key={board}
                  size="sm"
                  className={cn(
                    "items-center rounded-2xl py-3 text-center transition-all",
                    wpm ? "ring-primary/20 hover:ring-primary/40" : "bg-muted/20",
                  )}
                >
                  <CardContent className="flex flex-col items-center gap-1 px-3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      {prettyBoard(board)}
                    </span>
                    {loading ? (
                      <Skeleton className="h-8 w-14" />
                    ) : (
                      <span
                        className={`text-2xl font-bold tabular-nums ${wpm ? "text-primary" : "text-muted-foreground/50"}`}
                      >
                        {wpm ?? "-"}
                      </span>
                    )}
                    {rank ? (
                      <Badge
                        variant="secondary"
                        className="mt-0.5 min-w-9 text-[9px] font-bold tracking-widest"
                      >
                        #{rank}
                      </Badge>
                    ) : boardRanks === null ? (
                      <Skeleton className="mt-0.5 h-5 w-9 rounded-full" />
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trend charts — side by side, wpm with avg dotted */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
              <IconTrendingUp className="size-4" /> wpm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading || resultsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : wpmWithAvgData.length >= 2 ? (
              <ChartContainer config={wpmConfig} className="h-40 w-full">
                <ComposedChart data={wpmWithAvgData}>
                  <defs>
                    <linearGradient id="fillWpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-wpm)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-wpm)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="wpm"
                    type="monotone"
                    stroke="var(--color-wpm)"
                    fill="url(#fillWpm)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="avg"
                    type="monotone"
                    stroke="var(--color-avg)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
                <IconTrendingUp className="mr-2 size-4" /> finish more tests
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
              <IconTarget className="size-4" /> accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading || resultsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : chartData.length >= 2 ? (
              <ChartContainer config={accConfig} className="h-40 w-full">
                <ComposedChart data={accWithAvgData}>
                  <defs>
                    <linearGradient id="fillAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accuracy)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-accuracy)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} domain={[70, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="accuracy"
                    type="monotone"
                    stroke="var(--color-accuracy)"
                    fill="url(#fillAccuracy)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="avgAcc"
                    type="monotone"
                    stroke="var(--color-avgAcc)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
                <IconTarget className="mr-2 size-4" /> finish more tests
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WPM distribution — full width */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconChartBar className="size-4" /> wpm distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading || resultsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : distributionData.length >= 1 ? (
            <ChartContainer config={distConfig} className="h-40 w-full">
              <BarChart data={distributionData}>
                <defs>
                  <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="url(#fillCount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
              <IconTrophy className="mr-2 size-4" /> no tests yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top achievements — uses AchievementGrid */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconAward className="size-4" /> achievements
            {achievements === null ? (
              <Skeleton className="ml-auto h-[18px] w-12 rounded-full" />
            ) : (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {unlockedAch.length}/{allAch.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {achievements === null ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : unlockedAch.length > 0 ? (
            <AchievementGrid
              achievements={unlockedAch
                .slice()
                .sort((a, b) => b.xp - a.xp)
                .slice(0, 8)
                .map((a) => ({
                  id: a.id,
                  name: a.name,
                  description: a.description,
                  trigger: a.trigger,
                  achievedAt: a.achievedAt,
                  progress: a.progress,
                }))}
              columns={4}
              gap="sm"
              badgeSize="sm"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              no achievements yet. finish tests to earn badges.
            </p>
          )}
          {achievements === null ? (
            <Skeleton className="mt-3 h-4 w-32" />
          ) : (
            <Button
              variant="link"
              size="sm"
              className="mt-3 h-auto gap-1 p-0 text-xs"
              onClick={() => setAchOpen(true)}
            >
              view all achievements <IconArrowRight className="size-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* All achievements modal — uses AchievementList with progress */}
      <Dialog open={achOpen} onOpenChange={setAchOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2">
              <IconAward className="size-4" /> achievements
              <Badge variant="secondary" className="text-[10px]">
                {unlockedAch.length}/{allAch.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <Tabs value={achTab} onValueChange={(v) => setAchTab(v as "all" | "unlocked" | "locked")}>
            <TabsList>
              <TabsTrigger value="all">all</TabsTrigger>
              <TabsTrigger value="unlocked">unlocked</TabsTrigger>
              <TabsTrigger value="locked">locked</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex-1 overflow-y-auto pr-1">
            <AchievementList
              achievements={filteredAch.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                trigger: a.trigger,
                achievedAt: a.achievedAt,
                progress: a.progress,
              }))}
              badgeSize="sm"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity — last 12 months / by year with totals */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconClock className="size-4" /> activity
            {loading || resultsLoading ? (
              <Skeleton className="ml-2 h-3 w-28" />
            ) : (
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                {totalTestsInStreakPeriod} tests{" "}
                {streakYear === "last12" ? "in last 12 months" : `in ${streakYear}`}
              </span>
            )}
            <div className="ml-auto">
              {loading || resultsLoading ? (
                <SelectSkeleton className="w-36" />
              ) : (
                <Select
                  value={String(streakYear)}
                  onValueChange={(v) => setStreakYear(v === "last12" ? "last12" : Number(v))}
                >
                  <SelectTrigger size="sm" className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last12">last 12 months</SelectItem>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading || resultsLoading ? (
            <StreakCalendarSkeleton />
          ) : (
            <StreakCalendar
              streak={streakPeriods}
              counts={countsRecord}
              displayYear={streakYear}
              view="year"
              compact
              className="max-w-none"
            />
          )}
        </CardContent>
      </Card>

      {/* Test history */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconHistory className="size-4" /> test history
            {resultsLoading ? (
              <Skeleton className="ml-auto h-[18px] w-12 rounded-full" />
            ) : (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {results?.length ?? 0} tests
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading || resultsLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-2xl" />
              ))}
            </div>
          ) : (results ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <IconHistory className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">no tests recorded yet</p>
              <Link href="/" className="text-sm text-primary hover:underline">
                start typing →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>date</TableHead>
                    <TableHead className="text-right">wpm</TableHead>
                    <TableHead className="text-right">raw</TableHead>
                    <TableHead className="text-right">accuracy</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">consistency</TableHead>
                    <TableHead className="hidden text-right md:table-cell">mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleHistory.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => {
                        // Full details are immutable — reuse them if already fetched
                        const cached = lcGet<TestResult>(`result:${r.id}`, RESULT_DETAIL_TTL);
                        if (cached) {
                          setSelected(cached);
                          return;
                        }
                        // Open immediately with lite data, fetch full in background
                        setSelected(r);
                        getResultById(r.id).then((full) => {
                          if (full) {
                            setSelected(full);
                            lcSet(`result:${r.id}`, full);
                          }
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {pbIds.has(r.id) ? (
                            <Badge
                              variant="secondary"
                              className="w-9 shrink-0 justify-center gap-0.5 px-0 text-[9px] font-bold tracking-widest"
                            >
                              <IconCrown className="size-3" /> PB
                            </Badge>
                          ) : (
                            // Reserve the same width on non-PB rows so the wpm
                            // numbers (and PB badges) align across every row.
                            <span aria-hidden="true" className="w-9 shrink-0" />
                          )}
                          <span className="font-bold tabular-nums text-primary">{r.wpm}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.rawWpm}
                      </TableCell>
                      <AccCell value={r.accuracy} />
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {r.consistency}%
                      </TableCell>
                      <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          {modeLabel(r)}
                          {r.punctuation && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconAt className="size-3 text-muted-foreground/70" />
                              </TooltipTrigger>
                              <TooltipContent>punctuation</TooltipContent>
                            </Tooltip>
                          )}
                          {r.numbers && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconHash className="size-3 text-muted-foreground/70" />
                              </TooltipTrigger>
                              <TooltipContent>numbers</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(results?.length ?? 0) > historyCount && (
                <div className="mt-3 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const nextCount = historyCount + 10;
                      if ((results?.length ?? 0) >= nextCount) {
                        // Data already loaded, just reveal more
                        setHistoryCount(nextCount);
                      } else {
                        // Fetch next batch from server
                        const more = await getUserResults({
                          limit: 10,
                          offset: results?.length ?? 0,
                          lite: true,
                        });
                        if (more && more.length > 0) {
                          setResults((prev) => [...(prev ?? []), ...more]);
                        }
                        setHistoryCount(nextCount);
                      }
                    }}
                  >
                    load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test detail dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-end gap-4 sm:gap-8">
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <span className="text-3xl font-bold tabular-nums text-primary sm:text-5xl">
                        {selected.wpm}
                      </span>
                      {pbIds.has(selected.id) && (
                        <Badge
                          variant="secondary"
                          className="gap-0.5 text-[9px] font-bold tracking-widest"
                        >
                          <IconCrown className="size-3" /> PB
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs tracking-wider">wpm</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="text-3xl font-bold tabular-nums sm:text-5xl">
                      {selected.accuracy}%
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs tracking-wider">acc</span>
                  </span>
                </DialogTitle>
                <DialogDescription>
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-secondary bg-secondary text-secondary-foreground h-5 text-[10px] font-medium normal-case"
                      >
                        {modeLabel(selected)}
                      </Badge>
                      {selected.punctuation && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case"
                            >
                              <IconAt className="size-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>punctuation</TooltipContent>
                        </Tooltip>
                      )}
                      {selected.numbers && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case"
                            >
                              <IconHash className="size-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>numbers</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(selected.createdAt).toLocaleString()}
                    </span>
                  </span>
                </DialogDescription>
              </DialogHeader>
              {selected.timeline ? (
                <WpmChart timeline={selected.timeline} compact />
              ) : (
                <Skeleton className="h-40 sm:h-56 w-full rounded-2xl" />
              )}
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6 sm:gap-3">
                <Mini label="raw" value={String(selected.rawWpm)} />
                <Mini label="cons" value={`${selected.consistency}%`} />
                {selected.chars ? (
                  <>
                    <Mini label="correct" value={String(selected.chars.correct)} />
                    <Mini label="errors" value={String(selected.chars.incorrect)} />
                    <Mini label="extra" value={String(selected.chars.extra)} />
                    <Mini label="missed" value={String(selected.chars.missed)} />
                  </>
                ) : (
                  <>
                    <MiniSkeleton label="correct" />
                    <MiniSkeleton label="errors" />
                    <MiniSkeleton label="extra" />
                    <MiniSkeleton label="missed" />
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── sub-components ── */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-1 px-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wider">
          {icon} {label}
        </span>
        {value === null ? (
          <div className="flex h-7 items-center">
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <span className="text-xl font-bold tabular-nums text-primary">{value}</span>
        )}
      </CardContent>
    </Card>
  );
}

function AccCell({ value }: { value: number }) {
  return <TableCell className="text-right tabular-nums text-foreground">{value}%</TableCell>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" className="items-center rounded-2xl py-2 text-center">
      <CardContent className="flex flex-col gap-0.5 px-2">
        <div className="font-semibold tabular-nums">{value}</div>
        <div className="text-[10px] tracking-wider text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function MiniSkeleton({ label }: { label: string }) {
  return (
    <Card size="sm" className="items-center rounded-2xl py-2 text-center">
      <CardContent className="flex flex-col gap-0.5 px-2">
        <Skeleton className="mx-auto h-4 w-8 mb-1" />
        <div className="text-[10px] tracking-wider text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function prettyBoard(board: string): string {
  const [mode, variant] = board.split(":");
  return mode === "time" ? `${variant}s` : `${variant}w`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/**
 * Compare two lite result lists for equality, ignoring row order (queries are
 * ordered by created_at, so ties can come back in any order between calls).
 * Used to skip state updates when a background refetch returns unchanged data.
 */
function resultsEqual(a: TestResult[] | null, b: TestResult[] | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  const canon = (arr: TestResult[]) =>
    [...arr]
      .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
      .map((r) =>
        JSON.stringify([
          r.id,
          r.createdAt,
          r.mode,
          r.variant,
          r.source,
          r.punctuation,
          r.numbers,
          r.wpm,
          r.rawWpm,
          r.accuracy,
          r.consistency,
        ]),
      );
  const ca = canon(a);
  const cb = canon(b);
  return ca.every((s, i) => s === cb[i]);
}
