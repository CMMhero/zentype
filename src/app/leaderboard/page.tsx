"use client";

import { useEffect, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconCalendar, IconCalendarMonth, IconTrophy } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import { LeaderboardRankings, type LeaderboardRankingItem } from "~/components/ui/leaderboard-rankings";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";
import { getLeaderboard } from "~/server/leaderboard";
import { getUserPoints } from "~/server/gamification";
import { useUser } from "~/components/user-provider";
import type { GameMode, LeaderboardEntry } from "~/lib/types";

type Period = "all" | "week" | "today";

function periodToDate(period: Period): string | undefined {
  if (period === "all") return undefined;
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.toISOString();
}

export default function LeaderboardPage() {
  const user = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get("mode") === "words" ? "words" : "time") as GameMode;
  const rawVariant = Number(searchParams.get("variant"));
  const defaultVariant = mode === "words" ? 25 : 30;
  const validVariants = mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const variant = validVariants.includes(rawVariant) ? rawVariant : defaultVariant;
  const period = (["all", "week", "today"].includes(searchParams.get("period") ?? "")
    ? searchParams.get("period")!
    : "all") as Period;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const [userPoints, setUserPoints] = useState<{ totalXP: number; level: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    startTransition(() => { setEntries([]); });
    const since = periodToDate(period);
    void getLeaderboard({ mode, variant, limit: 50, since }).then((data) => {
      if (!cancelled) {
        startTransition(() => setEntries(data));
        setLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [mode, variant, period]);

  useEffect(() => {
    if (!user) return;
    void getUserPoints().then((p) => {
      if (p) setUserPoints({ totalXP: p.totalXP, level: p.level });
    });
  }, [user]);

  const loading = pending || !loaded;

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/leaderboard?${params.toString()}`);
  }

  const rankings: LeaderboardRankingItem[] = entries.map((e) => ({
    userId: e.userId,
    userName: e.username,
    rank: e.rank,
    value: Math.round(e.wpm * 100 + e.accuracy), // composite score
    byline: `${e.wpm} wpm · ${e.accuracy}% acc`,
    avatarUrl: e.avatarUrl,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophy className="text-primary size-5" />
          leaderboard
          <span className="text-xs text-muted-foreground">/ global bests</span>
        </h1>
        <div className="flex items-center gap-2">
          {userPoints && (
            <span className="text-xs text-muted-foreground">
              Level <span className="text-foreground font-bold">{userPoints.level}</span> ·{" "}
              <span className="text-foreground font-bold">{userPoints.totalXP.toLocaleString()}</span> XP
            </span>
          )}
          <Tabs value={mode} onValueChange={(v) => setParam("mode", v)}>
            <TabsList>
              <TabsTrigger value="time">time</TabsTrigger>
              <TabsTrigger value="words">words</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={String(variant)} onValueChange={(v) => setParam("variant", v)}>
            <SelectTrigger size="sm" aria-label="variant filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(mode === "time" ? ["15", "30", "60", "120"] : ["10", "25", "50", "100"]).map((v) => (
                <SelectItem key={v} value={v}>
                  {v}{mode === "time" ? "s" : "w"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex items-center gap-1">
        <Tabs value={period} onValueChange={(v) => setParam("period", v)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5"><IconCalendarMonth className="size-3.5" /> all time</TabsTrigger>
            <TabsTrigger value="week" className="gap-1.5"><IconCalendar className="size-3.5" /> this week</TabsTrigger>
            <TabsTrigger value="today" className="gap-1.5"><IconCalendar className="size-3.5" /> today</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="text-xs text-muted-foreground">
        ranked by composite score (wpm + accuracy) · minimum 80% accuracy to qualify ·
        results sync when you finish a test signed in.
      </p>

      {loading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          no entries yet — finish a test while signed in to claim rank #1.
        </div>
      ) : (
        <LeaderboardRankings
          rankings={rankings}
          currentUserId={user?.id}
          showPagination
          defaultPageSize={25}
          onUserClick={(r) => router.push(`/profile/${r.userName}`)}
        />
      )}
    </div>
  );
}
