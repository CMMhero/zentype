"use client";

import {
  IconBolt,
  IconCalendar,
  IconCalendarMonth,
  IconKeyboard,
  IconTrophy,
  IconTrophyFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  type LeaderboardRankingItem,
  LeaderboardRankings,
} from "~/components/ui/leaderboard-rankings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useUser } from "~/components/user-provider";
import { lcGetEntry, lcSet } from "~/lib/client-cache";
import type { GameMode, LeaderboardEntry } from "~/lib/types";
import {
  getLeaderboard,
  getLevelLeaderboard,
  type LevelLeaderboardEntry,
} from "~/server/leaderboard";

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
  return (
    <Suspense>
      <LeaderboardContent />
    </Suspense>
  );
}

function LeaderboardContent() {
  const user = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const boardTab = (searchParams.get("board") === "level" ? "level" : "wpm") as BoardTab;
  const mode = (searchParams.get("mode") === "words" ? "words" : "time") as GameMode;
  const rawVariant = Number(searchParams.get("variant"));
  const defaultVariant = mode === "words" ? 25 : 30;
  const validVariants = mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const variant = validVariants.includes(rawVariant) ? rawVariant : defaultVariant;
  const rawPeriod = searchParams.get("period");
  const period: Period =
    rawPeriod === "all" || rawPeriod === "week" || rawPeriod === "today" ? rawPeriod : "all";

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [levelEntries, setLevelEntries] = useState<LevelLeaderboardEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  // Stale-while-revalidate: each board/mode/variant/period combo is cached in
  // localStorage, so switching tabs or periods renders instantly and skips the
  // refetch entirely while the cache is still fresh (30s).
  useEffect(() => {
    let cancelled = false;
    const FRESH = 30_000;
    const TTL = 60_000;
    setLoaded(false);

    if (boardTab === "level") {
      const key = "lblevel:50";
      const cached = lcGetEntry<LevelLeaderboardEntry[]>(key, TTL);
      if (cached) {
        startTransition(() => setLevelEntries(cached.data));
        setLoaded(true);
        if (cached.ageMs < FRESH)
          return () => {
            cancelled = true;
          }; // fresh — skip refetch
      } else {
        startTransition(() => {
          setLevelEntries([]);
        });
      }
      void getLevelLeaderboard(50)
        .then((data) => {
          if (!cancelled) {
            startTransition(() => setLevelEntries(data));
            if (data.length > 0) lcSet(key, data);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }

    const key = `lbwpm:${mode}:${variant}:${period}`;
    const cached = lcGetEntry<LeaderboardEntry[]>(key, TTL);
    if (cached) {
      startTransition(() => setEntries(cached.data));
      setLoaded(true);
      if (cached.ageMs < FRESH)
        return () => {
          cancelled = true;
        }; // fresh — skip refetch
    } else {
      startTransition(() => {
        setEntries([]);
      });
    }
    const since = periodToDate(period);
    void getLeaderboard({ mode, variant, limit: 50, since })
      .then((data) => {
        if (!cancelled) {
          startTransition(() => setEntries(data));
          if (data.length > 0) lcSet(key, data);
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error("[zentype] leaderboard load failed:", err);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, variant, period, boardTab]);

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
    byline: `${e.wpm} wpm, ${e.accuracy}% acc`,
    avatarUrl: e.avatarUrl,
  }));

  const levelRankings: LeaderboardRankingItem[] = levelEntries.map((e) => ({
    userId: e.userId,
    userName: e.username,
    rank: e.rank,
    value: e.totalXP,
    byline: `Level ${e.level}, ${e.totalXP.toLocaleString()} XP`,
    avatarUrl: e.avatarUrl,
  }));

  const isLevel = boardTab === "level";
  const activeRankings = isLevel ? levelRankings : rankings;
  const activeEmpty = isLevel ? levelEntries.length === 0 : entries.length === 0;

  const myRankItem = activeRankings.find((r) => r.userId === user?.id) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophyFilled className="text-primary size-5" />
          leaderboard
        </h1>
        <div className="flex items-center gap-2">
          <Tabs value={boardTab} onValueChange={(v) => setParam("board", v)}>
            <TabsList>
              <TabsTrigger value="wpm" className="gap-1.5">
                <IconTrophy className="size-3.5" /> wpm
              </TabsTrigger>
              <TabsTrigger value="level" className="gap-1.5">
                <IconBolt className="size-3.5" /> level
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {!isLevel && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={mode}
              onValueChange={(v) => {
                if (v) setParam("mode", v);
              }}
            >
              <SelectTrigger size="sm" className="w-24 sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">time</SelectItem>
                <SelectItem value="words">words</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(variant)}
              onValueChange={(v) => {
                if (v) setParam("variant", v);
              }}
            >
              <SelectTrigger size="sm" aria-label="variant filter" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(mode === "time" ? ["15", "30", "60", "120"] : ["10", "25", "50", "100"]).map(
                  (v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                      {mode === "time" ? "s" : "w"}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <Tabs
            value={period}
            onValueChange={(v) => setParam("period", v)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 gap-1.5 sm:flex-none">
                <IconCalendarMonth className="size-3.5" />{" "}
                <span className="hidden xs:inline">all time</span>
                <span className="xs:hidden">all</span>
              </TabsTrigger>
              <TabsTrigger value="week" className="flex-1 gap-1.5 sm:flex-none">
                <IconCalendar className="size-3.5" />{" "}
                <span className="hidden xs:inline">this week</span>
                <span className="xs:hidden">week</span>
              </TabsTrigger>
              <TabsTrigger value="today" className="flex-1 gap-1.5 sm:flex-none">
                <IconCalendar className="size-3.5" /> today
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {myRankItem && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3">
          <span className="text-xs font-bold tracking-widest text-primary">your rank</span>
          <span className="ml-2 flex items-center gap-1 text-sm font-bold tabular-nums">
            #{myRankItem.rank}{" "}
            <span className="text-muted-foreground font-normal">{myRankItem.byline}</span>
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {isLevel
              ? `${myRankItem.value.toLocaleString()} XP`
              : `${Math.round(myRankItem.value)} pts`}
          </span>
        </div>
      )}

      {loading ? (
        <LeaderboardSkeleton />
      ) : activeEmpty ? (
        <Empty className="gap-3 rounded-2xl border border-dashed border-border/60 py-14">
          <EmptyHeader className="gap-2">
            <EmptyMedia variant="icon">
              {isLevel ? <IconBolt className="size-5" /> : <IconTrophy className="size-5" />}
            </EmptyMedia>
            <EmptyTitle className="text-base">
              {isLevel ? "no levels yet" : "no entries yet"}
            </EmptyTitle>
            <EmptyDescription className="max-w-xs">
              {isLevel
                ? "finish a test to earn xp and climb the ranks."
                : "finish a test while signed in to claim rank #1."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="gap-2">
            <Button size="sm" className="gap-2" render={<Link href="/" />}>
              <IconKeyboard className="size-4" /> start typing
            </Button>
          </EmptyContent>
        </Empty>
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
