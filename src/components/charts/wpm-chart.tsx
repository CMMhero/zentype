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
}: {
  timeline: TimelinePoint[];
  className?: string;
}) {
  if (timeline.length < 2) {
    return (
      <div
        className={cn(
          "border-border/60 text-muted-foreground flex h-44 items-center justify-center rounded-md border border-dashed text-xs",
          className,
        )}
      >
        not enough data for a graph — run a longer test
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
    <ChartContainer config={chartConfig} className={cn("h-56 w-full", className)}>
      <defs>
        <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-wpm)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--color-wpm)" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="rawGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-raw)" stopOpacity={0.15} />
          <stop offset="100%" stopColor="var(--color-raw)" stopOpacity={0.01} />
        </linearGradient>
        <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-errors)" stopOpacity={0.8} />
          <stop offset="100%" stopColor="var(--color-errors)" stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="Second"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={24}
          tickFormatter={(v: number) => `${v}s`}
        />
        <YAxis tickLine={false} axisLine={false} width={40} domain={[0, "auto"]} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
          content={<ChartTooltipContent labelKey="t" />}
        />
        <Bar dataKey="errors" fill="url(#errorsGradient)" radius={[2, 2, 0, 0]} barSize={4} yAxisId="right" />
        <Area
          dataKey="raw"
          type="monotone"
          stroke="var(--color-raw)"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          fill="url(#rawGradient)"
          dot={false}
        />
        <Area
          dataKey="wpm"
          type="monotone"
          stroke="var(--color-wpm)"
          strokeWidth={2}
          fill="url(#wpmGradient)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
