"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowRight, IconAward, IconAt, IconChartBar, IconClock, IconCrown, IconEye, IconGauge, IconHash, IconHistory,
  IconLink, IconTarget, IconStopwatch, IconTrendingUp, IconTrophy, IconUserFilled,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "~/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { StreakCalendar } from "~/components/ui/streak-calendar";
import { AchievementGrid } from "~/components/ui/achievement-grid";
import { AchievementList } from "~/components/ui/achievement-list";
import dynamic from "next/dynamic";
const WpmChart = dynamic(() => import("~/components/charts/wpm-chart").then((m) => m.WpmChart), { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> });
import { getMyJoinDate, getUserResults, getUserStats, type AggregatedStats } from "~/server/results";
import { getUserPoints, getUserAchievements } from "~/server/gamification";
import { getBoardRanks } from "~/server/leaderboard";
import { lcGet, lcSet, lcDel } from "~/lib/client-cache";
import { useUser } from "~/components/user-provider";
import { modeLabel, type TestResult } from "~/lib/types";
import { formatDateTime } from "~/lib/utils";
import { ACHIEVEMENTS } from "~/lib/achievements";

/** All board keys in display order */
const ALL_BOARDS = [
  "time:15", "time:30", "time:60", "time:120",
  "words:10", "words:25", "words:50", "words:100",
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
  const [points, setPoints] = useState<{ totalXP: number; level: number; progress: number } | null>(null);
  const [achievements, setAchievements] = useState<Array<{
    id: string; name: string; description: string; trigger: "metric" | "streak" | "api";
    achievedAt: string | null; progress: number; xp: number;
  }> | null>(null);
  const [selected, setSelected] = useState<TestResult | null>(null);
  const [achOpen, setAchOpen] = useState(false);
  const [achTab, setAchTab] = useState<"all" | "unlocked" | "locked">("all");
  const [streakYear, setStreakYear] = useState<number | "last12">("last12");
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(10);
  const [boardRanks, setBoardRanks] = useState<Record<string, number> | null>(null);

  // Stale-while-revalidate: show cached data instantly, fetch fresh in background
  useEffect(() => {
    let cancelled = false;
    const FIVE_MIN = 5 * 60 * 1000;
    const ONE_MIN = 60 * 1000;
    // Namespace cache keys by user ID to prevent cross-user data leakage
    const uid = user?.id ?? "anon";
    const ck = (suffix: string) => `${uid}:${suffix}`;
    // Clean up old non-namespaced keys from before this fix
    ["profile-stats", "profile-results", "profile-points", "profile-achievements", "profile-join-date"].forEach((k) => lcDel(k));

    // Load cached data immediately (no loading state)
    const cStats = lcGet<AggregatedStats>(ck("profile-stats"), FIVE_MIN);
    const cResults = lcGet<TestResult[]>(ck("profile-results"), FIVE_MIN);
    const cPoints = lcGet<{ totalXP: number; level: number; progress: number }>(ck("profile-points"), ONE_MIN);
    const cAchievements = lcGet<Array<{ id: string; name: string; description: string; trigger: "metric" | "streak" | "api"; achievedAt: string | null; progress: number; xp: number }>>(ck("profile-achievements"), FIVE_MIN);
    const cJoinDate = lcGet<string>(ck("profile-join-date"), FIVE_MIN);

    if (cStats) setStats(cStats);
    if (cResults) setResults(cResults);
    if (cPoints) setPoints(cPoints);
    if (cAchievements) setAchievements(cAchievements);
    if (cJoinDate) setJoinedAt(cJoinDate);

    // Fetch all data in parallel (single round-trip for everything)
    void Promise.all([
      getUserStats(),
      getUserResults({ limit: 200 }),
      user ? getUserPoints() : Promise.resolve(null),
      user ? getUserAchievements() : Promise.resolve(null),
      user ? getMyJoinDate() : Promise.resolve(null),
    ]).then(([s, r, p, a, j]) => {
      if (cancelled) return;
      if (s) { setStats(s); lcSet(ck("profile-stats"), s); }
      if (r) { setResults(r); lcSet(ck("profile-results"), r); }
      if (p) { setPoints(p); lcSet(ck("profile-points"), p); }
      if (a) { setAchievements(a); lcSet(ck("profile-achievements"), a); }
      if (j) { setJoinedAt(j); lcSet(ck("profile-join-date"), j); }
    });

    return () => { cancelled = true; };
  }, [user]);

  // Board ranks depend on stats (use latest from state, whether cached or fresh)
  useEffect(() => {
    if (!user || !stats) return;
    const boards = Object.keys(stats.bestByBoard);
    if (boards.length === 0) return;
    void getBoardRanks(user.id, boards).then(setBoardRanks);
  }, [user, stats]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const loading = stats === null || results === null;
  const chartData = (results ?? []).slice(0, 100).reverse();

  // Streak data
  const dayMap = new Map<string, number>();
  for (const r of (results ?? [])) {
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
    if (dayMap.has(key)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
  }
  let longestStreak = currentStreak;
  let run = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { run = 1; continue; }
    const prev = new Date(sortedDays[i - 1]);
    const cur = new Date(sortedDays[i]);
    if (Math.abs((cur.getTime() - prev.getTime()) / 86400000 - 1) < 0.5) { run++; } else { run = 1; }
    if (run > longestStreak) longestStreak = run;
  }
  const streakPeriods = sortedDays.map((d) => ({ periodStart: d, periodEnd: d }));
  const countsRecord = Object.fromEntries(dayMap.entries()) as Record<string, number>;
  const availableYears = Array.from(
    new Set([...sortedDays.map((d) => Number(d.slice(0, 4))), new Date().getFullYear()])
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
  const allAch = (achievements ?? ACHIEVEMENTS.map((a) => ({
    id: a.id, name: a.name, description: a.description, trigger: a.trigger,
    achievedAt: null as string | null, progress: 0, xp: a.xp,
  })));
  const filteredAch = achTab === "unlocked" ? allAch.filter((a) => a.achievedAt !== null) : achTab === "locked" ? allAch.filter((a) => a.achievedAt === null) : allAch;

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8" role="main" aria-label="User profile">
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
                <IconEye className="size-3.5" /> <span className="hidden sm:inline">view public profile</span><span className="sm:hidden">public</span>
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
              <IconLink className="size-3.5" /> <span className="hidden sm:inline">copy link</span><span className="sm:hidden">copy</span>
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
                <AvatarFallback className="rounded text-xl font-bold uppercase">{user.username.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{user.username}</h1>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {joinedAt && (
                  <p className="text-[10px] text-muted-foreground/70">
                    joined {new Date(joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
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
                <span className="text-lg font-bold tabular-nums text-primary">Lv. {points.level}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/80">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all shadow-sm shadow-primary/30" style={{ width: `${points.progress}%` }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{points.totalXP.toLocaleString()} XP</span>
              </div>
            ) : (
              <p className="mt-4 text-[10px] text-muted-foreground">finish tests to earn xp</p>
            )}
          </CardContent>
        </Card>

        {/* 2x2 stat grid — same height as profile card */}
        <div className="grid grid-cols-2 gap-3 row-span-2">
          <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={loading ? null : String(stats!.avgWpm10)} />
          <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={loading ? null : String(stats!.avgWpmAll)} />
          <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={loading ? null : `${stats!.avgAccuracy}%`} />
          <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={loading ? null : formatDuration(stats!.timeTypedSeconds)} />
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
                  <div key={board} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${wpm ? "border-primary/20 bg-gradient-to-b from-primary/5 to-transparent hover:border-primary/40" : "border-border/30 bg-muted/20"}`}>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{prettyBoard(board)}</span>
                    {loading ? (
                      <Skeleton className="h-8 w-14" />
                    ) : (
                      <span className={`text-2xl font-bold tabular-nums ${wpm ? "text-primary" : "text-muted-foreground/50"}`}>{wpm ?? "-"}</span>
                    )}
                    {rank ? (
                      <span className="mt-0.5 inline-flex h-[18px] min-w-9 items-center justify-center rounded-full bg-secondary px-1.5 text-[9px] font-bold leading-none tracking-widest text-secondary-foreground">
                        #{rank}
                      </span>
                    ) : boardRanks === null ? (
                      <Skeleton className="mt-0.5 h-[18px] w-9 rounded-full" />
                    ) : null}
                  </div>
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
            {loading ? (
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
                  <Area dataKey="wpm" type="monotone" stroke="var(--color-wpm)" fill="url(#fillWpm)" strokeWidth={2} dot={false} />
                  <Line dataKey="avg" type="monotone" stroke="var(--color-avg)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
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
            {loading ? (
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
                  <Area dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" fill="url(#fillAccuracy)" strokeWidth={2} dot={false} />
                  <Line dataKey="avgAcc" type="monotone" stroke="var(--color-avgAcc)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
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
          {loading ? (
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
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
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
              <Skeleton className="ml-auto h-[18px] w-12 rounded" />
            ) : (
              <Badge variant="secondary" className="ml-auto text-[10px]">{unlockedAch.length}/{allAch.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {achievements === null ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
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
            <p className="text-xs text-muted-foreground">no achievements yet. finish tests to earn badges.</p>
          )}
          {achievements === null ? (
            <Skeleton className="mt-3 h-4 w-32" />
          ) : (
            <Button variant="link" size="sm" className="mt-3 h-auto gap-1 p-0 text-xs" onClick={() => setAchOpen(true)}>
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
              <Badge variant="secondary" className="text-[10px]">{unlockedAch.length}/{allAch.length}</Badge>
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
            {loading ? (
              <Skeleton className="ml-2 h-3 w-28" />
            ) : (
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                {totalTestsInStreakPeriod} tests {streakYear === "last12" ? "in last 12 months" : `in ${streakYear}`}
              </span>
            )}
            <div className="ml-auto">
              {loading ? (
                <Skeleton className="h-7 w-36" />
              ) : (
                <Select value={String(streakYear)} onValueChange={(v) => setStreakYear(v === "last12" ? "last12" : Number(v))}>
                  <SelectTrigger size="sm" className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last12">last 12 months</SelectItem>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <Skeleton className="h-24 w-full" />
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
            <Badge variant="secondary" className="ml-auto text-[10px]">{results?.length ?? 0} tests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 rounded" />)}
            </div>
          ) : (results ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <IconHistory className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">no tests recorded yet</p>
              <Link href="/" className="text-sm text-primary hover:underline">start typing →</Link>
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
                    <TableRow key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-primary">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {pbIds.has(r.id) && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-secondary-foreground">
                              <IconCrown className="size-3" /> PB
                            </span>
                          )}
                          {r.wpm}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.rawWpm}</TableCell>
                      <AccCell value={r.accuracy} />
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.consistency}%</TableCell>
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
                  <Button variant="outline" size="sm" onClick={() => setHistoryCount((c) => Math.min(c + 10, results?.length ?? c))}>
                    load more ({(results?.length ?? 0) - historyCount} remaining)
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
                      <span className="text-3xl font-bold tabular-nums text-primary sm:text-5xl">{selected.wpm}</span>
                      {pbIds.has(selected.id) && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-secondary-foreground">
                          <IconCrown className="size-3" /> PB
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground mt-1 text-xs tracking-wider">wpm</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="text-3xl font-bold tabular-nums sm:text-5xl">{selected.accuracy}%</span>
                    <span className="text-muted-foreground mt-1 text-xs tracking-wider">acc</span>
                  </span>
                </DialogTitle>
                <DialogDescription>
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground h-5 text-[10px] font-medium normal-case">
                        {modeLabel(selected)}
                      </Badge>
                      {selected.punctuation && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case">
                              <IconAt className="size-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>punctuation</TooltipContent>
                        </Tooltip>
                      )}
                      {selected.numbers && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case">
                              <IconHash className="size-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>numbers</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</span>
                  </span>
                </DialogDescription>
              </DialogHeader>
              <WpmChart timeline={selected.timeline} compact />
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6 sm:gap-3">
                <Mini label="raw" value={String(selected.rawWpm)} />
                <Mini label="cons" value={`${selected.consistency}%`} />
                <Mini label="correct" value={String(selected.chars.correct)} />
                <Mini label="errors" value={String(selected.chars.incorrect)} />
                <Mini label="extra" value={String(selected.chars.extra)} />
                <Mini label="missed" value={String(selected.chars.missed)} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── sub-components ── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <Card className="gap-1 py-3 bg-card hover:bg-muted/30 transition-colors">
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
    <div className="rounded border border-border/30 bg-card p-2">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] tracking-wider text-muted-foreground">{label}</div>
    </div>
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
