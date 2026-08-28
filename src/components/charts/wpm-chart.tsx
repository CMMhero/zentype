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
        <Bar dataKey="errors" fill="var(--color-errors)" radius={[2, 2, 0, 0]} barSize={4} yAxisId="right" />
        <Area
          dataKey="raw"
          type="monotone"
          stroke="var(--color-raw)"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          fill="var(--color-raw)"
          fillOpacity={0.06}
          dot={false}
        />
        <Area
          dataKey="wpm"
          type="monotone"
          stroke="var(--color-wpm)"
          strokeWidth={2}
          fill="var(--color-wpm)"
          fillOpacity={0.12}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
