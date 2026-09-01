import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "~/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color !== undefined);
  if (!colorConfig.length) return null;

  const css = Object.entries(config)
    .filter(([, item]) => item.color !== undefined)
    .map(([key, item]) => `--color-${key}: ${item.color};`)
    .join(";\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${css}\n}`,
      }}
    />
  );
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_line]:stroke-border [&_.recharts-radian-bar]:pointer-events-none [&_.recharts-rectangle.recharts-tooltip-cursor]:bg-muted [&_.recharts-reference-line_line]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartTooltip = RechartsPrimitive.Tooltip;

export interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: unknown;
  className?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  labelFormatter?: (label: unknown, payload: TooltipPayloadItem[]) => React.ReactNode;
  formatter?: (
    value: number | string,
    name: string,
    item: TooltipPayloadItem,
    index: number,
    payload: Record<string, unknown>,
  ) => React.ReactNode;
  labelKey?: string;
  nameKey?: string;
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  label,
  labelFormatter,
  formatter,
  labelKey,
  nameKey,
}: TooltipContentProps) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    const [item] = payload;
    const key = `${labelKey || (item?.dataKey as string) || (item?.name as string) || "value"}`;
    const itemConfig = config[key];
    const value =
      !labelKey && (typeof label === "string" || typeof label === "number")
        ? label
        : itemConfig?.label || (item?.dataKey as string) || (item?.name as string);
    return labelFormatter ? (
      <div className="font-medium">{labelFormatter(value, payload)}</div>
    ) : (
      <div className="font-medium">{value}</div>
    );
  }, [label, labelFormatter, payload, hideLabel, labelKey, config]);

  if (!active || !payload?.length) return null;

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = config[key];
          const indicatorColor = item.color ?? item.payload?.fill;

          return (
            <div
              key={index}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full items-stretch gap-2 leading-none [&>svg]:h-2.5 [&>svg]:w-2.5",
              )}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload ?? {})
              ) : (
                <>
                  <span
                    className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                      "h-2.5 w-2.5": indicator === "dot",
                      "w-1": indicator === "line",
                      "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                      "my-0.5": nestLabel && indicator === "dashed",
                    })}
                    style={
                      {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor,
                      } as React.CSSProperties
                    }
                  />
                  <div className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                    <div className="grid gap-1.5">{nestLabel ? tooltipLabel : null}<span className="text-muted-foreground">{itemConfig?.label || item.name}</span></div>
                    {item.value !== undefined && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {typeof item.value === "number" ? Math.round(item.value * 100) / 100 : item.value}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
} & {
  payload?: TooltipPayloadItem[];
  verticalAlign?: "top" | "bottom" | "middle";
}) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
      {payload.map((item) => {
        const key = `${item.dataKey || item.name || "value"}`;
        const itemConfig = config[key];
        if (!itemConfig?.label) return null;
        return (
          <div key={String(item.value)} className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
            {itemConfig.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig.label}
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };