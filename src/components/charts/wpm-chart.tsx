import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { cn } from "~/lib/utils";
import type { TimelinePoint } from "~/lib/types";

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

  const data = timeline.map((p) => ({
    t: `${p.t}s`,
    Second: p.t,
    wpm: p.wpm,
    raw: p.raw,
    errors: p.errors || null,
  }));

  return (
    <ChartContainer config={chartConfig} className={cn(compact ? "h-40 sm:h-56" : "h-56", "w-full", className)}>
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
          <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-errors)" stopOpacity={0.9} />
            <stop offset="95%" stopColor="var(--color-errors)" stopOpacity={0.3} />
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
        <YAxis yAxisId="right" orientation="right" hide domain={[0, "auto"]} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltipContent labelFormatter={(l) => `${l}s`} indicator="dot" />}
        />
        <Bar dataKey="errors" fill="url(#fillErrors)" radius={[2, 2, 0, 0]} barSize={4} yAxisId="right" />
        <Area
          dataKey="raw"
          type="monotone"
          stroke="var(--color-raw)"
          strokeWidth={1.5}
          fill="url(#fillRaw)"
          dot={false}
        />
        <Area
          dataKey="wpm"
          type="monotone"
          stroke="var(--color-wpm)"
          strokeWidth={2}
          fill="url(#fillWpm)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
