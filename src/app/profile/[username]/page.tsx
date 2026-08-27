"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  IconAward, IconClock, IconGauge,
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
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";
import { getPublicProfile, type PublicProfile } from "~/server/results";
import { getUserAchievements } from "~/server/gamification";
import { StreakCalendar } from "~/components/ui/streak-calendar";
import { AchievementBadge } from "~/components/ui/achievement-badge";
import { ACHIEVEMENTS } from "~/lib/achievements";

const wpmConfig = {
  wpm: { label: "wpm", color: "var(--chart-1)" },
} satisfies ChartConfig;

const accConfig = {
  accuracy: { label: "accuracy", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Array<{
    id: string; name: string; description: string; trigger: "metric" | "streak" | "api";
    achievedAt: string | null; progress: number; xp: number;
  }> | null>(null);
  const [achOpen, setAchOpen] = useState(false);
  const [achTab, setAchTab] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    let cancelled = false;
    void getPublicProfile(username).then((p) => {
      if (!cancelled) { setProfile(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    void getUserAchievements().then((a) => {
      if (a && a.length > 0 && a[0].achievedAt !== null) setAchievements(a);
    });
  }, [profile]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Card className="row-span-2 gap-3 py-4">
            <CardContent className="flex flex-col items-center gap-4 px-6 pt-2">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="gap-1 py-3">
                <CardContent className="flex flex-col gap-1 px-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-1 h-7 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">user not found</p>
      </div>
    );
  }

  const { username: name, avatarUrl, stats, results } = profile;
  const safeResults = results ?? [];
  const chartData = safeResults.slice(0, 100).reverse();
  const bestBoardEntries = stats?.bestByBoard
    ? Object.entries(stats.bestByBoard).sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  const dayMap = new Map<string, number>();
  for (const r of safeResults) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const streakPeriods = Array.from(dayMap.keys()).sort().map((d) => ({ periodStart: d, periodEnd: d }));

  const allAch = achievements ?? ACHIEVEMENTS.map((a) => ({
    id: a.id, name: a.name, description: a.description, trigger: a.trigger,
    achievedAt: null as string | null, progress: 0, xp: a.xp,
  }));
  const unlockedAch = allAch.filter((a) => a.achievedAt !== null);
  const filteredAch = achTab === "unlocked" ? allAch.filter((a) => a.achievedAt !== null) : achTab === "locked" ? allAch.filter((a) => a.achievedAt === null) : allAch;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Level card + stat cards */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="row-span-2 gap-3 py-4">
          <CardContent className="flex flex-col items-center gap-4 px-6 pt-2">
            <Avatar className="size-20 border-2 border-primary/30">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="rounded text-2xl font-bold uppercase">{name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h1 className="text-xl font-bold">{name}</h1>
              <Badge variant="outline" className="text-[10px]">public profile</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={String(stats?.avgWpm10 ?? 0)} />
          <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={String(stats?.avgWpmAll ?? 0)} />
          <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={`${stats?.avgAccuracy ?? 0}%`} />
          <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={formatDuration(stats?.timeTypedSeconds ?? 0)} />
        </div>
      </div>

      {bestBoardEntries.length > 0 && (
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <IconTrophy className="text-primary size-4" /> personal bests
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-4">
            {bestBoardEntries.map(([board, wpm]) => (
              <Badge key={board} variant="secondary" className="gap-2 py-1.5 text-sm">
                <span className="text-muted-foreground">{prettyBoard(board)}</span>
                <span className="text-primary font-bold tabular-nums">{wpm}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {chartData.length >= 2 && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                <IconTrendingUp className="size-4" /> wpm
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ChartContainer config={wpmConfig} className="h-40 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, wpm: r.wpm }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="wpm" type="monotone" stroke="var(--color-wpm)" fill="var(--color-wpm)" fillOpacity={0.1} strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                <IconTarget className="size-4" /> accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ChartContainer config={accConfig} className="h-40 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, accuracy: r.accuracy }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis tickLine={false} axisLine={false} width={36} domain={[70, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" fill="var(--color-accuracy)" fillOpacity={0.1} strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top achievements */}
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
                    <div className="flex h-10 w-28 items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2 cursor-default [&>div>div]:!h-6 [&>div>div]:!w-6 [&>div]:!m-0 [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!shadow-none [&>span]:!hidden">
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
            <p className="text-xs text-muted-foreground">no achievements yet</p>
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
                  <div className="flex h-10 items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2 cursor-default [&>div>div]:!h-6 [&>div>div]:!w-6 [&>div]:!m-0 [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!p-0 [&>div]:!shadow-none [&>span]:!hidden">
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

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconClock className="size-4" /> activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <StreakCalendar streak={streakPeriods} view="year" className="max-w-none" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-1 px-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {icon} {label}
        </span>
        <span className="text-xl font-bold tabular-nums text-primary">{value}</span>
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
