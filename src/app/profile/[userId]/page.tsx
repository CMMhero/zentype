"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  IconCalendar, IconGauge, IconTarget, IconStopwatch, IconTrendingUp, IconTrophy,
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
import { getPublicProfile, type PublicProfile } from "~/server/results";
import { StreakCalendar } from "~/components/ui/streak-calendar";

const trendConfig = { wpm: { label: "wpm", color: "var(--chart-1)" } } satisfies ChartConfig;

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getPublicProfile(userId).then((p) => {
      if (!cancelled) { setProfile(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-1 py-4">
              <CardContent className="flex flex-col gap-1 px-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-1 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
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

  const { username, avatarUrl, stats, results } = profile;
  const safeResults = results ?? [];
  const chartData = safeResults.slice(0, 100).reverse();
  const bestBoardEntries = stats?.bestByBoard
    ? Object.entries(stats.bestByBoard).sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Avatar className="size-10">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="rounded text-xs uppercase">{username.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg font-semibold">{username}</h1>
          <Badge variant="outline" className="text-[10px]">public profile</Badge>
        </div>
      </header>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={String(stats.avgWpm10)} />
            <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={String(stats.avgWpmAll)} />
            <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={`${stats.avgAccuracy}%`} />
            <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={formatDuration(stats.timeTypedSeconds)} />
          </div>

          {bestBoardEntries.length > 0 && (
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
                  <IconTrophy className="text-primary size-4" /> personal bests
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 px-4">
                {bestBoardEntries.map(([board, wpm]) => (
                  <Badge key={board} variant="secondary" className="gap-1.5 py-1 text-xs">
                    <span className="text-muted-foreground">{prettyBoard(board)}</span>
                    <span className="text-primary font-bold tabular-nums">{wpm}</span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {chartData.length >= 2 && (
            <Card className="gap-2 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-xs tracking-widest uppercase">
                  wpm — last {Math.min(100, chartData.length)} tests
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <ChartContainer config={trendConfig} className="h-48 w-full">
                  <AreaChart data={chartData.map((r, i) => ({ n: i + 1, wpm: r.wpm }))}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area dataKey="wpm" type="monotone" stroke="var(--color-wpm)" fill="var(--color-wpm)" fillOpacity={0.15} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
            <IconCalendar className="size-4" /> activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {(() => {
            const dayMap = new Map<string, number>();
            for (const r of safeResults) {
              const d = new Date(r.createdAt);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
            }
            const streakPeriods = Array.from(dayMap.keys()).sort().map((d) => ({ periodStart: d, periodEnd: d }));
            return <StreakCalendar streak={streakPeriods} view="year" />;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">{icon} {label}</span>
        <span className="text-primary text-2xl font-bold tabular-nums">{value}</span>
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
