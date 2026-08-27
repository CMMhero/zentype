"use client";

import { useEffect, useTransition, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { IconCalendar, IconCalendarMonth, IconCrown, IconMedal, IconTrophy } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";
import { getLeaderboard } from "~/server/leaderboard";
import type { GameMode, LeaderboardEntry } from "~/lib/types";
import { formatDateTime } from "~/lib/utils";

type Period = "all" | "week" | "today";

function periodToDate(period: Period): string | undefined {
  if (period === "all") return undefined;
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  // today
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.toISOString();
}

export default function LeaderboardPage() {
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

  useEffect(() => {
    let cancelled = false;
    startTransition(() => { setEntries([]); });
    const since = periodToDate(period);
    void getLeaderboard({ mode, variant, limit: 50, since }).then((data) => {
      if (!cancelled) startTransition(() => setEntries(data));
    });
    return () => { cancelled = true; };
  }, [mode, variant, period]);

  const loading = pending || entries.length === 0;

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/leaderboard?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophy className="text-primary size-5" />
          leaderboard
          <span className="text-muted-foreground text-xs">/ global bests</span>
        </h1>
        <div className="flex items-center gap-2">
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

      <p className="text-muted-foreground text-xs">
        ranked by net wpm · ties broken by accuracy · minimum 80% accuracy to qualify ·
        results sync when you finish a test signed in.
      </p>

      {loading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <div className="border-border/60 text-muted-foreground rounded-md border border-dashed p-12 text-center text-sm">
          no entries yet — finish a test while signed in to claim rank #1.
        </div>
      ) : (
        <div className="border-border/60 overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">#</TableHead>
                <TableHead>typist</TableHead>
                <TableHead className="text-right">wpm</TableHead>
                <TableHead className="text-right">accuracy</TableHead>
                <TableHead className="hidden text-right sm:table-cell">consistency</TableHead>
                <TableHead className="hidden text-right md:table-cell">date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.userId}>
                  <TableCell><RankBadge rank={e.rank} /></TableCell>
                  <TableCell>
                    <Link
                      href={`/profile/${e.userId}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Avatar className="size-5">
                        {e.avatarUrl && <AvatarImage src={e.avatarUrl} alt="" />}
                        <AvatarFallback className="rounded text-[9px] uppercase">
                          {e.username.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-40 truncate">{e.username}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-primary text-right font-bold tabular-nums">
                    {e.wpm}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{e.accuracy}%</TableCell>
                  <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                    {e.consistency}%
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-right text-xs md:table-cell">
                    {formatDateTime(e.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge className="gap-1"><IconCrown className="size-3" /> 1</Badge>;
  if (rank === 2) return <Badge variant="secondary" className="gap-1"><IconMedal className="size-3" /> 2</Badge>;
  if (rank === 3) return <Badge variant="secondary" className="gap-1"><IconMedal className="size-3" /> 3</Badge>;
  return <span className="text-muted-foreground tabular-nums">{rank}</span>;
}
