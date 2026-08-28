"use client";

import { useEffect, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconBolt, IconCalendar, IconCalendarMonth, IconTrophy } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import { LeaderboardRankings, type LeaderboardRankingItem } from "~/components/ui/leaderboard-rankings";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";
import { getLeaderboard, getLevelLeaderboard, type LevelLeaderboardEntry } from "~/server/leaderboard";
import { getUserPoints } from "~/server/gamification";
import { useUser } from "~/components/user-provider";
import type { GameMode, LeaderboardEntry } from "~/lib/types";

type Period = "all" | "week" | "today";
type BoardTab = "wpm" | "level";

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
  const boardTab = (searchParams.get("board") === "level" ? "level" : "wpm") as BoardTab;
  const mode = (searchParams.get("mode") === "words" ? "words" : "time") as GameMode;
  const rawVariant = Number(searchParams.get("variant"));
  const defaultVariant = mode === "words" ? 25 : 30;
  const validVariants = mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const variant = validVariants.includes(rawVariant) ? rawVariant : defaultVariant;
  const period = (["all", "week", "today"].includes(searchParams.get("period") ?? "")
    ? searchParams.get("period")!
    : "all") as Period;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [levelEntries, setLevelEntries] = useState<LevelLeaderboardEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const [userPoints, setUserPoints] = useState<{ totalXP: number; level: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    if (boardTab === "level") {
      startTransition(() => { setLevelEntries([]); });
      void getLevelLeaderboard(50).then((data) => {
        if (!cancelled) {
          startTransition(() => setLevelEntries(data));
          setLoaded(true);
        }
      }).catch(() => { if (!cancelled) setLoaded(true); });
      return () => { cancelled = true; };
    }
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
  }, [mode, variant, period, boardTab]);

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

  const levelRankings: LeaderboardRankingItem[] = levelEntries.map((e) => ({
    userId: e.userId,
    userName: e.username,
    rank: e.rank,
    value: e.totalXP,
    byline: `Level ${e.level} · ${e.totalXP.toLocaleString()} XP`,
    avatarUrl: e.avatarUrl,
  }));

  const isLevel = boardTab === "level";
  const activeRankings = isLevel ? levelRankings : rankings;
  const activeEmpty = isLevel ? levelEntries.length === 0 : entries.length === 0;

  const myRankItem = activeRankings.find((r) => r.userId === user?.id) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophy className="text-primary size-5" />
          leaderboard
          <span className="text-xs text-muted-foreground">/ {isLevel ? "levels" : "global bests"}</span>
        </h1>
        <div className="flex items-center gap-2">
          {userPoints && (
            <span className="text-xs text-muted-foreground">
              Level <span className="text-foreground font-bold">{userPoints.level}</span> ·{" "}
              <span className="text-foreground font-bold">{userPoints.totalXP.toLocaleString()}</span> XP
            </span>
          )}
          <Tabs value={boardTab} onValueChange={(v) => setParam("board", v)}>
            <TabsList>
              <TabsTrigger value="wpm" className="gap-1.5"><IconTrophy className="size-3.5" /> wpm</TabsTrigger>
              <TabsTrigger value="level" className="gap-1.5"><IconBolt className="size-3.5" /> level</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {!isLevel && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => setParam("mode", v)}>
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">time</SelectItem>
                <SelectItem value="words">words</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(variant)} onValueChange={(v) => setParam("variant", v)}>
              <SelectTrigger size="sm" aria-label="variant filter" className="w-20">
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
          <Tabs value={period} onValueChange={(v) => setParam("period", v)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5"><IconCalendarMonth className="size-3.5" /> all time</TabsTrigger>
              <TabsTrigger value="week" className="gap-1.5"><IconCalendar className="size-3.5" /> this week</TabsTrigger>
              <TabsTrigger value="today" className="gap-1.5"><IconCalendar className="size-3.5" /> today</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {isLevel
          ? "ranked by total XP · gain XP from tests and achievements · level = floor(XP/500)+1"
          : "ranked by composite score (wpm + accuracy) · minimum 80% accuracy to qualify · results sync when you finish a test signed in."}
      </p>

      {myRankItem && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 px-4 py-3">
          <span className="text-xs font-bold tracking-widest uppercase text-primary">your rank</span>
          <span className="ml-2 flex items-center gap-1 text-sm font-bold tabular-nums">
            #{myRankItem.rank} <span className="text-muted-foreground font-normal">{myRankItem.byline}</span>
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {isLevel ? `${myRankItem.value.toLocaleString()} XP` : `${Math.round(myRankItem.value)} pts`}
          </span>
        </div>
      )}

      {loading ? (
        <LeaderboardSkeleton />
      ) : activeEmpty ? (
        <div className="rounded-md border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          {isLevel ? "no levels yet — finish a test to earn XP." : "no entries yet — finish a test while signed in to claim rank #1."}
        </div>
      ) : (
        <LeaderboardRankings
          rankings={activeRankings}
          currentUserId={user?.id}
          showPagination
          defaultPageSize={25}
          onUserClick={(r) => router.push(`/profile/${r.userName}`)}
        />
      )}
    </div>
  );
}
