"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  IconArrowLeft, IconAward, IconClock, IconGauge,
  IconTarget, IconStopwatch, IconTrendingUp, IconTrophy, IconUserFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { getPublicProfile, type PublicProfile } from "~/server/results";
import { getUserAchievementsByUsername, getUserPointsByUsername } from "~/server/gamification";
import { getBoardRanks } from "~/server/leaderboard";
import { StreakCalendar } from "~/components/ui/streak-calendar";
import { AchievementGrid } from "~/components/ui/achievement-grid";

import { ACHIEVEMENTS } from "~/lib/achievements";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<{ totalXP: number; level: number; progress: number } | null>(null);
  const [achievements, setAchievements] = useState<Array<{
    id: string; name: string; description: string; trigger: "metric" | "streak" | "api";
    achievedAt: string | null; progress: number; xp: number;
  }> | null>(null);
  
  const [streakYear, setStreakYear] = useState<number | "last12">("last12");
  const [boardRanks, setBoardRanks] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPublicProfile(username)
      .then((p) => {
        if (!cancelled) { setProfile(p); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    void getUserAchievementsByUsername(username).then((a) => {
      setAchievements(a);
    });
    void getUserPointsByUsername(username).then((p) => {
      if (p) setPoints(p);
    });
  }, [profile, username]);

  useEffect(() => {
    if (!profile?.stats) return;
    const boards = Object.keys(profile.stats.bestByBoard);
    if (boards.length === 0 || !profile.userId) return;
    void getBoardRanks(profile.userId, boards).then(setBoardRanks);
  }, [profile]);

  if (!profile) {
    if (loading) return <ProfileSkeleton />;
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex flex-col items-center gap-8 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
            <div className="size-48 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <span className="text-[120px] font-bold leading-none tracking-tighter text-primary/10 select-none">
            ?
          </span>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">user not found</h1>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              there&apos;s no account with that username. double-check the spelling or try searching for them in the command bar.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="sm" className="gap-2">
              <Link href="/leaderboard">
                <IconTrophy className="size-4" /> view leaderboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 text-xs" onClick={() => history.back()}>
              <IconArrowLeft className="size-3" /> go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { username: name, avatarUrl, stats, results } = profile;
  const safeResults = results ?? [];

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
  

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconUserFilled className="text-primary size-5" /> profile
        </h1>
      </header>
      {/* Level card + stat cards */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="row-span-2 gap-3 py-3">
          <CardContent className="px-5 pt-2">
            {/* Row 1: Avatar + Username */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 shrink-0 border-2 border-primary/30">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="rounded text-xl font-bold uppercase">{name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{name}</h1>
                <Badge variant="outline" className="text-[10px]">public profile</Badge>
                {profile!.joinedAt && (
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    Joined {new Date(profile!.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            {/* Row 2: Level/XP bar — compact single row */}
            {loading ? (
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
              <p className="mt-4 text-[10px] text-muted-foreground">No XP yet</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 row-span-2">
          <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={loading ? null : String(stats?.avgWpm10 ?? 0)} />
          <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={loading ? null : String(stats?.avgWpmAll ?? 0)} />
          <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={loading ? null : `${stats?.avgAccuracy ?? 0}%`} />
          <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={loading ? null : formatDuration(stats?.timeTypedSeconds ?? 0)} />
        </div>
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconTrophy className="size-4" /> personal bests
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {ALL_BOARDS.map((board) => {
              const wpm = loading ? null : stats?.bestByBoard?.[board];
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
                    <span className="mt-0.5 inline-flex h-[18px] min-w-9 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[9px] font-bold leading-none tracking-widest text-primary">
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

      {/* Top achievements — uses AchievementGrid */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconAward className="size-4" /> achievements
            {achievements === null ? (
              <Skeleton className="ml-auto h-[18px] w-12 rounded-full" />
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
            <p className="text-xs text-muted-foreground">no achievements yet</p>
          )}
          
        </CardContent>
      </Card>

      

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
                    <SelectItem value="last12">Last 12 months</SelectItem>
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
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <Card className="gap-1 py-3 bg-gradient-to-br from-card to-muted/30 hover:to-muted/50 transition-colors">
      <CardContent className="flex flex-col gap-1 px-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wider">
          {icon} {label}
        </span>
        {value === null ? <Skeleton className="mt-1 h-7 w-16" /> : <span className="text-xl font-bold tabular-nums text-primary">{value}</span>}
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

const ALL_BOARDS = [
  "time:15", "time:30", "time:60", "time:120",
  "words:10", "words:25", "words:50", "words:100",
] as const;

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconUserFilled className="text-primary size-5" /> profile
        </h1>
      </header>
      {/* Level card + stat cards */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="row-span-2 gap-3 py-3">
          <CardContent className="px-5 pt-2">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3 row-span-2">
          {[
            { icon: <IconTrendingUp className="size-4" />, label: "avg wpm (last 10)" },
            { icon: <IconGauge className="size-4" />, label: "avg wpm (all)" },
            { icon: <IconTarget className="size-4" />, label: "avg accuracy" },
            { icon: <IconStopwatch className="size-4" />, label: "time typed" },
          ].map(({ icon, label }) => (
            <Card key={label} className="gap-1 bg-gradient-to-br py-3 from-card to-muted/30">
              <CardContent className="flex flex-col gap-1 px-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wider">
                  {icon} {label}
                </span>
                <div className="flex h-7 items-center">
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
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
            {ALL_BOARDS.map((board) => (
              <div key={board} className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-muted/20 p-3 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{prettyBoard(board)}</span>
                <div className="flex h-8 items-center">
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="mt-0.5 h-[18px] w-9 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconAward className="size-4" /> achievements
            <Skeleton className="ml-auto h-[18px] w-12 rounded-full" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="mt-3 h-4 w-32" />
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconClock className="size-4" /> activity
            <Skeleton className="ml-2 h-3 w-28" />
            <div className="ml-auto">
              <Skeleton className="h-7 w-36" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4"><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    </div>
  );
}
