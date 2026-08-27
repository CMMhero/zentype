"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAward, IconClock, IconGauge, IconHistory,
  IconTarget, IconStopwatch, IconTrendingUp, IconTrophy,
} from "@tabler/icons-react";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "~/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
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
import { StreakCalendar } from "~/components/ui/streak-calendar";
import { AchievementBadge } from "~/components/ui/achievement-badge";
import { WpmChart } from "~/components/charts/wpm-chart";
import { getUserResults, getUserStats, type AggregatedStats } from "~/server/results";
import { getUserPoints, getUserAchievements } from "~/server/gamification";
import { useUser } from "~/components/user-provider";
import { modeLabel, type TestResult } from "~/lib/types";
import { formatDateTime } from "~/lib/utils";
import { ACHIEVEMENTS } from "~/lib/achievements";

const wpmConfig = {
  wpm: { label: "wpm", color: "var(--chart-1)" },
} satisfies ChartConfig;

const accConfig = {
  accuracy: { label: "accuracy", color: "var(--chart-3)" },
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

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getUserStats(), getUserResults({ limit: 200 })]).then(([s, r]) => {
      if (cancelled) return;
      setStats(s);
      setResults(r);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    void Promise.all([getUserPoints(), getUserAchievements()]).then(([p, a]) => {
      if (p) setPoints(p);
      if (a) setAchievements(a);
    });
  }, [user]);

  if (!user) {
    router.push("/login");
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

  const unlockedAch = (achievements ?? []).filter((a) => a.achievedAt !== null);
  const allAch = (achievements ?? ACHIEVEMENTS.map((a) => ({
    id: a.id, name: a.name, description: a.description, trigger: a.trigger,
    achievedAt: null as string | null, progress: 0, xp: a.xp,
  })));
  const filteredAch = achTab === "unlocked" ? allAch.filter((a) => a.achievedAt !== null) : achTab === "locked" ? allAch.filter((a) => a.achievedAt === null) : allAch;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Level card + stat cards */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        {/* Level card — avatar + level info side by side */}
        <Card className="row-span-2 gap-3 py-4">
          <CardContent className="flex items-center gap-5 px-6 pt-2">
            <Avatar className="size-16 shrink-0 border-2 border-primary/30">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="rounded text-xl font-bold uppercase">{user.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{user.username}</h1>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {points && points.totalXP > 0 ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-primary">{points.level}</span>
                    <span className="text-[10px] text-muted-foreground">level</span>
                    <span className="ml-auto text-xs font-bold tabular-nums">{points.totalXP.toLocaleString()} <span className="text-muted-foreground">xp</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${points.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{points.progress}%</span>
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-muted-foreground">finish tests to earn xp</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2x2 stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={loading ? null : String(stats!.avgWpm10)} />
          <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={loading ? null : String(stats!.avgWpmAll)} />
          <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={loading ? null : `${stats!.avgAccuracy}%`} />
          <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={loading ? null : formatDuration(stats!.timeTypedSeconds)} />
        </div>
      </div>

      {/* Personal bests */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconTrophy className="text-primary size-4" /> personal bests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 px-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-28" />)
          ) : Object.keys(stats!.bestByBoard).length === 0 ? (
            <span className="text-sm text-muted-foreground">no results yet</span>
          ) : (
            Object.entries(stats!.bestByBoard)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([board, wpm]) => (
                <Badge key={board} variant="secondary" className="gap-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">{prettyBoard(board)}</span>
                  <span className="text-primary font-bold tabular-nums">{wpm}</span>
                </Badge>
              ))
          )}
        </CardContent>
      </Card>

      {/* Trend charts — side by side */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <IconTrendingUp className="size-4" /> wpm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : chartData.length >= 2 ? (
              <ChartContainer config={wpmConfig} className="h-40 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, wpm: r.wpm }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="wpm" type="monotone" stroke="var(--color-wpm)" fill="var(--color-wpm)" fillOpacity={0.1} strokeWidth={2} dot={false} />
                </AreaChart>
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
            <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <IconTarget className="size-4" /> accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : chartData.length >= 2 ? (
              <ChartContainer config={accConfig} className="h-40 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, accuracy: r.accuracy }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} domain={[70, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" fill="var(--color-accuracy)" fillOpacity={0.1} strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
                <IconTarget className="mr-2 size-4" /> finish more tests
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top achievements — click to see all */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconAward className="size-4" /> top achievements
            <Badge variant="secondary" className="ml-auto text-[10px]">{unlockedAch.length}/{allAch.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {unlockedAch.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unlockedAch.sort((a, b) => b.xp - a.xp).slice(0, 5).map((a) => (
                <Tooltip key={a.id}>
                  <TooltipTrigger asChild>
                    <div className="flex h-10 w-28 items-center justify-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2 cursor-default [&>div>div]:!h-6 [&>div>div]:!w-6 [&>div]:!m-0 [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!shadow-none [&>span]:!hidden">
                      <AchievementBadge
                        achievement={{ id: a.id, name: a.name, trigger: a.trigger, achievedAt: a.achievedAt, progress: a.progress }}
                        badgeSize="xs"
                      />
                      <span className="truncate text-xs font-medium leading-tight">{a.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-48">
                    <p className="font-semibold text-xs">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.description}</p>
                    <p className="mt-1 text-[10px] text-primary">{a.xp} XP</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">no achievements yet — finish tests to earn badges</p>
          )}
          <button onClick={() => setAchOpen(true)} className="mt-3 text-xs text-primary hover:underline">
            view all achievements →
          </button>
        </CardContent>
      </Card>

      {/* All achievements modal */}
      <Dialog open={achOpen} onOpenChange={setAchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAward className="size-4" /> achievements
              <Badge variant="secondary" className="ml-auto text-[10px]">{unlockedAch.length}/{allAch.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          <Tabs value={achTab} onValueChange={(v) => setAchTab(v as "all" | "unlocked" | "locked")}>
            <TabsList>
              <TabsTrigger value="all">all</TabsTrigger>
              <TabsTrigger value="unlocked">unlocked</TabsTrigger>
              <TabsTrigger value="locked">locked</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto py-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredAch.map((a) => (
              <Tooltip key={a.id}>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2 cursor-default [&>div>div]:!h-6 [&>div>div]:!w-6 [&>div]:!m-0 [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!shadow-none [&>span]:!hidden">
                    <AchievementBadge
                      achievement={{ id: a.id, name: a.name, trigger: a.trigger, achievedAt: a.achievedAt, progress: a.progress }}
                      badgeSize="xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium leading-tight">{a.name}</p>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-48">
                  <p className="font-semibold text-xs">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                  <p className="mt-1 text-[10px] text-primary">{a.xp} XP</p>
                  {a.progress > 0 && a.progress < 100 && (
                    <p className="text-[10px] text-muted-foreground">{a.progress}% complete</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Streak */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconClock className="size-4" /> streak
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <StreakCalendar streak={streakPeriods} view="year" compact className="max-w-none" />
        </CardContent>
      </Card>

      {/* Test history */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconHistory className="size-4" /> test history
            <span className="text-muted-foreground font-normal">/ {results?.length ?? 0} tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-muted" />)}
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
                  {(results ?? []).map((r) => (
                    <TableRow key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-primary">{r.wpm}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.rawWpm}</TableCell>
                      <AccCell value={r.accuracy} />
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.consistency}%</TableCell>
                      <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                        {modeLabel(r)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test detail dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold tabular-nums text-primary">{selected.wpm}</span>
                  <span className="text-sm font-normal text-muted-foreground">wpm</span>
                  <span className="ml-auto text-lg tabular-nums">{selected.accuracy}%</span>
                  <span className="text-sm font-normal text-muted-foreground">accuracy</span>
                </DialogTitle>
                <DialogDescription>
                  {modeLabel(selected)} · {new Date(selected.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <WpmChart timeline={selected.timeline} />
              <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
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
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-1 px-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {icon} {label}
        </span>
        {value === null ? <Skeleton className="mt-1 h-7 w-16" /> : <span className="text-xl font-bold tabular-nums text-primary">{value}</span>}
      </CardContent>
    </Card>
  );
}

function AccCell({ value }: { value: number }) {
  const tone = value >= 97 ? "text-chart-3" : value >= 90 ? "text-foreground" : "text-destructive";
  return <TableCell className={`text-right tabular-nums ${tone}`}>{value}%</TableCell>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-secondary/40 p-2">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] tracking-wider uppercase text-muted-foreground">{label}</div>
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
