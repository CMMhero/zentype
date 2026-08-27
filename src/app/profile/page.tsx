"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity, IconCalendar, IconGauge, IconTarget, IconStopwatch, IconTrendingUp, IconTrophy,
} from "@tabler/icons-react";
import {
  Area, AreaChart, CartesianGrid, Line, XAxis, YAxis,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "~/components/ui/chart";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { getUserResults, getUserStats, type AggregatedStats } from "~/server/results";
import { useUser } from "~/components/user-provider";
import type { TestResult } from "~/lib/types";
import { StreakCalendar } from "~/components/streak-calendar";

const trendConfig = { wpm: { label: "wpm", color: "var(--chart-1)" } } satisfies ChartConfig;
const accConfig = { accuracy: { label: "accuracy", color: "var(--chart-3)" } } satisfies ChartConfig;

export default function ProfilePage() {
  const user = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getUserStats(), getUserResults({ limit: 100 })]).then(([s, r]) => {
      if (cancelled) return;
      setStats(s);
      setResults(r);
    });
    return () => { cancelled = true; };
  }, []);

  if (!user) {
    router.push("/login");
    return null;
  }

  const loading = stats === null || results === null;
  const chartData = (results ?? []).slice(0, 100).reverse();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          {user.username}
          <span className="text-muted-foreground ml-3 font-mono text-xs">{user.email}</span>
        </h1>
        <Badge variant="outline">account active</Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<IconTrendingUp className="size-4" />} label="avg wpm (last 10)" value={loading ? null : String(stats!.avgWpm10)} />
        <StatCard icon={<IconGauge className="size-4" />} label="avg wpm (all)" value={loading ? null : String(stats!.avgWpmAll)} />
        <StatCard icon={<IconTarget className="size-4" />} label="avg accuracy" value={loading ? null : `${stats!.avgAccuracy}%`} />
        <StatCard icon={<IconStopwatch className="size-4" />} label="time typed" value={loading ? null : formatDuration(stats!.timeTypedSeconds)} />
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
            <IconTrophy className="text-primary size-4" /> personal bests by board
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 px-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)
          ) : Object.keys(stats!.bestByBoard).length === 0 ? (
            <span className="text-muted-foreground text-sm">no results yet</span>
          ) : (
            Object.entries(stats!.bestByBoard)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([board, wpm]) => (
                <Badge key={board} variant="secondary" className="gap-1.5 py-1 text-xs">
                  <span className="text-muted-foreground">{prettyBoard(board)}</span>
                  <span className="text-primary font-bold tabular-nums">{wpm}</span>
                </Badge>
              ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-widest uppercase">
              wpm — last {Math.min(100, chartData.length)} tests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {chartData.length >= 2 ? (
              <ChartContainer config={trendConfig} className="h-48 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, wpm: r.wpm }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="wpm" type="monotone" stroke="var(--color-wpm)" fill="var(--color-wpm)" fillOpacity={0.15} strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-widest uppercase">accuracy trend</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {chartData.length >= 2 ? (
              <ChartContainer config={accConfig} className="h-48 w-full">
                <AreaChart data={chartData.map((r, i) => ({ n: i + 1, accuracy: r.accuracy }))}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={[70, 100]} tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
            <IconCalendar className="size-4" /> activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <StreakCalendar results={results ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="border-border/60 text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed text-xs">
      <IconActivity className="mr-2 size-4" /> finish more tests to unlock trends
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
          {icon} {label}
        </span>
        {value === null ? <Skeleton className="mt-1 h-8 w-16" /> : <span className="text-primary text-2xl font-bold tabular-nums">{value}</span>}
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
