"use client";

import { useEffect, useState } from "react";
import { getPublicStats } from "~/server/results";
import { lcGetEntry, lcSet } from "~/lib/client-cache";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

type PublicStats = NonNullable<Awaited<ReturnType<typeof getPublicStats>>>;

/** Cache community stats client-side so revisiting /about renders instantly. */
const CACHE_KEY = "about:community-stats";
const CACHE_TTL = 5 * 60 * 1000; // serve from cache for 5 minutes
const FRESH_MS = 60 * 1000; // skip the refetch entirely when fresher than this

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  const display =
    typeof value === "string"
      ? value
      : value >= 1000
        ? `${(value / 1000).toFixed(1)}k`
        : value.toLocaleString();
  return (
    <Card size="sm" className="items-center py-3 text-center">
      <CardContent className="flex flex-col gap-1 px-3">
        <div className="text-primary text-xl font-bold tabular-nums">{display}</div>
        <div className="text-muted-foreground text-[10px] tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}

function CommunityStatsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} size="sm" className="items-center py-3 text-center">
          <CardContent className="flex w-full flex-col gap-1 px-3">
            <Skeleton className="mx-auto h-7 w-16" />
            <Skeleton className="mx-auto h-3 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CommunityStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Stale-while-revalidate: a cached value renders immediately on revisit and,
  // when fresh, skips the fetch entirely. Otherwise refresh in the background.
  useEffect(() => {
    const cached = lcGetEntry<PublicStats>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      setStats(cached.data);
      if (cached.ageMs < FRESH_MS) return; // fresh — skip refetch
    }
    let cancelled = false;
    void getPublicStats().then((s) => {
      if (cancelled || !s) return;
      setStats(s);
      lcSet(CACHE_KEY, s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return <CommunityStatsSkeleton />;
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="users" value={stats.totalUsers ?? 0} />
      <StatCard label="tests completed" value={stats.totalTests ?? 0} />
      <StatCard label="time typed" value={formatTime(stats.totalSeconds ?? 0)} />
      <StatCard label="xp earned" value={stats.totalXpEarned ?? 0} />
    </div>
  );
}
