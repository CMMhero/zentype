import { Skeleton } from "~/components/ui/skeleton";
import { StreakCalendarSkeleton } from "~/components/ui/streak-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  IconAward, IconChartBar, IconClock, IconHistory, IconTrophy, IconUserFilled,
  IconGauge, IconTarget, IconStopwatch, IconTrendingUp,
} from "@tabler/icons-react";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Header — static */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconUserFilled className="text-primary size-5" /> profile
        </h1>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-4xl" />
          <Skeleton className="h-8 w-20 rounded-4xl" />
        </div>
      </header>

      {/* Level card + stat grid */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="row-span-2 gap-3 py-3">
          <CardContent className="px-5 pt-2">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
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
            <Card key={label} className="gap-1 py-3">
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

      {/* Personal bests — static grid with skeleton values */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconTrophy className="size-4" /> personal bests
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {["15s", "30s", "60s", "120s", "10w", "25w", "50w", "100w"].map((label) => (
              <Card key={label} size="sm" className="items-center bg-muted/20 py-3 text-center">
                <CardContent className="flex flex-col items-center gap-1 px-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</span>
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="mt-0.5 h-5 w-9 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts — static cards with skeleton chart area */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
              <IconTrendingUp className="size-4" /> wpm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
          </CardContent>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
              <IconTarget className="size-4" /> accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>

      {/* Distribution — static card */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconChartBar className="size-4" /> wpm distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </CardContent>
      </Card>

      {/* Achievements — static card with skeleton grid */}
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
              <Skeleton key={i} className="h-28 w-full rounded-4xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity — static card */}
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
        <CardContent className="px-4">
          <StreakCalendarSkeleton />
        </CardContent>
      </Card>

      {/* Test history — static card */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconHistory className="size-4" /> test history
            <Skeleton className="ml-auto h-[18px] w-16 rounded-full" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
