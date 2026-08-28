"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  IconAward, IconClock, IconGauge,
  IconTarget, IconStopwatch, IconTrendingUp, IconTrophy,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { getPublicProfile, type PublicProfile } from "~/server/results";
import { getUserAchievements } from "~/server/gamification";
import { getBoardRanks } from "~/server/leaderboard";
import { StreakCalendar } from "~/components/ui/streak-calendar";
import { AchievementGrid } from "~/components/ui/achievement-grid";
import { AchievementList } from "~/components/ui/achievement-list";
import { ACHIEVEMENTS } from "~/lib/achievements";

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
  const [streakYear, setStreakYear] = useState<number | "last12">("last12");
  const [boardRanks, setBoardRanks] = useState<Record<string, number> | null>(null);

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

  useEffect(() => {
    if (!profile?.stats) return;
    const boards = Object.keys(profile.stats.bestByBoard);
    if (boards.length === 0 || !profile.userId) return;
    void getBoardRanks(profile.userId, boards).then(setBoardRanks);
  }, [profile]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
        {/* Level card + 2x2 stats — matches loaded layout */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Card className="row-span-2 gap-3 py-4">
            <CardContent className="flex flex-col items-center gap-4 px-6 pt-2">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-24" />
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

        {/* Personal bests */}
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <Skeleton className="h-3 w-28" />
          </CardHeader>
          <CardContent className="flex gap-2 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </CardContent>
        </Card>

        {/* Charts — side by side */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4"><Skeleton className="h-3 w-16" /></CardHeader>
            <CardContent className="px-4"><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
          <Card className="gap-3 py-4">
            <CardHeader className="px-4"><Skeleton className="h-3 w-20" /></CardHeader>
            <CardContent className="px-4"><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
        </div>

        {/* Top achievements */}
        <Card className="gap-3 py-4">
          <CardHeader className="px-4"><Skeleton className="h-3 w-32" /></CardHeader>
          <CardContent className="px-4">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-32" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="gap-3 py-4">
          <CardHeader className="px-4"><Skeleton className="h-3 w-20" /></CardHeader>
          <CardContent className="px-4"><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
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
  const countsRecord = Object.fromEntries(dayMap.entries()) as Record<string, number>;
  const availableYears = Array.from(
    new Set([...Array.from(dayMap.keys()).map((d) => Number(d.slice(0, 4))), new Date().getFullYear()])
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
              {profile.joinedAt && (
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                  Joined {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              )}
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
            {bestBoardEntries.map(([board, wpm]) => {
              const rank = boardRanks?.[board];
              return (
                <Badge key={board} variant="secondary" className="gap-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">{prettyBoard(board)}</span>
                  <span className="text-primary font-bold tabular-nums">{wpm}</span>
                  {rank && (
                    <span className="ml-1 rounded bg-primary/10 px-1 py-0 text-[10px] font-bold tracking-widest text-primary">
                      #{rank}
                    </span>
                  )}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Top achievements — uses AchievementGrid */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconAward className="size-4" /> achievements
            <Badge variant="secondary" className="ml-auto text-[10px]">{unlockedAch.length}/{allAch.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {unlockedAch.length > 0 ? (
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
            <p className="text-xs text-muted-foreground">no achievements yet</p>
          )}
          <button onClick={() => setAchOpen(true)} className="mt-3 text-xs text-primary hover:underline">
            view all achievements →
          </button>
        </CardContent>
      </Card>

      {/* All achievements modal — uses AchievementList */}
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

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <IconClock className="size-4" /> activity
            <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
              {totalTestsInStreakPeriod} tests {streakYear === "last12" ? "in last 12 months" : `in ${streakYear}`}
            </span>
            <div className="ml-auto">
              <Select value={String(streakYear)} onValueChange={(v) => setStreakYear(v === "last12" ? "last12" : Number(v))}>
                <SelectTrigger size="sm" className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last12">Last 12 months</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <StreakCalendar
            streak={streakPeriods}
            counts={countsRecord}
            displayYear={streakYear}
            view="year"
            compact
            className="max-w-none"
          />
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
