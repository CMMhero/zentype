import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import type { TimelinePoint } from "~/lib/types";
import { cn } from "~/lib/utils";

const chartConfig = {
  wpm: { label: "wpm", color: "var(--chart-1)" },
  raw: { label: "raw", color: "var(--muted-foreground)" },
  errors: { label: "errors", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function WpmChart({
  timeline,
  className,
  compact = false,
}: {
  timeline: TimelinePoint[];
  className?: string;
  compact?: boolean;
}) {
  if (timeline.length < 2) {
    return (
      <div
        className={cn(
          "border-border/60 text-muted-foreground flex h-44 items-center justify-center rounded-md border border-dashed text-xs",
          className,
        )}
      >
        not enough data for a graph. run a longer test.
      </div>
    );
  }

  // Total errors across the test (exclude last point — it's a finish
  // snapshot and may contain cumulative totals in older saved data).
  const totalErrors = timeline.slice(0, -1).reduce((sum, p) => sum + (p.errors || 0), 0);

  const data = timeline.map((p, i) => ({
    t: `${p.t}s`,
    Second: p.t,
    wpm: p.wpm,
    raw: p.raw,
    // Skip error bar for the last point — it's a finish snapshot and may
    // contain cumulative totals in older saved data.
    errors: i < timeline.length - 1 ? p.errors || null : null,
  }));

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer
        config={chartConfig}
        className={cn(compact ? "h-40 sm:h-56" : "h-56", "w-full")}
        role="img"
        aria-label="WPM performance chart"
      >
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fillWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-wpm)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-wpm)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillRaw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-raw)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-raw)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="Second"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            minTickGap={24}
            tickFormatter={(v: number) => `${v}s`}
          />
          <YAxis tickLine={false} axisLine={false} width={44} tickMargin={8} domain={[0, "auto"]} />
          {/* Hidden right axis so the error bars scale independent of the wpm axis */}
          <YAxis yAxisId="right" orientation="right" hide domain={[0, totalErrors || 1]} />
          <ChartTooltip
            cursor={{ stroke: "var(--border)" }}
            content={
              <ChartTooltipContent
                // Without a labelKey the tooltip falls back to the first
                // series' config label ("wpm"), so read the timeline second
                // straight from the hovered data point.
                labelFormatter={(_value, payload) => `${payload?.[0]?.payload?.Second ?? ""}s`}
                indicator="dot"
              />
            }
          />
          {/* Children order drives tooltip order: wpm, raw, errors */}
          <Area
            dataKey="wpm"
            type="monotone"
            stroke="var(--color-wpm)"
            strokeWidth={2}
            fill="url(#fillWpm)"
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Area
            dataKey="raw"
            type="monotone"
            stroke="var(--color-raw)"
            strokeWidth={1.5}
            fill="url(#fillRaw)"
            dot={false}
          />
          <Bar
            dataKey="errors"
            fill="var(--color-errors)"
            radius={[2, 2, 0, 0]}
            barSize={4}
            yAxisId="right"
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
