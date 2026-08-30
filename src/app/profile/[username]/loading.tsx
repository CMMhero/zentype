import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  IconAward, IconClock, IconGauge, IconTarget, IconStopwatch, IconTrendingUp,
  IconTrophy, IconUserFilled,
} from "@tabler/icons-react";

export default function PublicProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Header — static */}
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconUserFilled className="text-primary size-5" /> profile
        </h1>
      </header>

      {/* Level card + stat grid */}
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
            <Card key={label} className="gap-1 py-3 bg-gradient-to-br from-card to-muted/30">
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

      {/* Personal bests — static grid */}
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
            <IconTrophy className="size-4" /> personal bests
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {["15s", "30s", "60s", "120s", "10w", "25w", "50w", "100w"].map((label) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-muted/20 p-3 text-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{label}</span>
                <Skeleton className="h-8 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements — static card */}
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
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
