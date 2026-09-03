"use client";

import {
  IconAward,
  IconClock,
  IconFlame,
  IconSparkles,
  IconTarget,
  IconUserPlus,
} from "@tabler/icons-react";
import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export interface PointsAwardTrigger {
  id: string;
  type: string;
  points: number;
  metricName?: string | null;
  metricThreshold?: number | null;
  achievementName?: string | null;
  streakLengthThreshold?: number | null;
  timeUnit?: "hour" | "day";
  timeInterval?: number | null;
}

export interface PointsAward {
  id: string;
  awarded: number;
  /** ISO 8601 datetime */
  date: string;
  /** User's total points after this award */
  total: number;
  trigger: PointsAwardTrigger;
}

interface PointsAwardsProps extends React.HTMLAttributes<HTMLDivElement> {
  awards: PointsAward[];
  formatTotalPoints?: (value: number) => string;
  formatAwardedPoints?: (value: number) => string;
  /** Format the award `date` for the first column (default: short locale date). */
  formatDate?: (isoDate: string) => string;
}

type TriggerIcon = React.ComponentType<{ className?: string }>;

const triggerIconMap: Record<string, TriggerIcon> = {
  metric: IconTarget,
  achievement: IconAward,
  streak: IconFlame,
  time: IconClock,
  user_creation: IconUserPlus,
};

function triggerIcon(type: string): TriggerIcon {
  return triggerIconMap[type] ?? IconSparkles;
}

/** Human-readable action line for tooltips — prefers `metricName` when present. */
function awardActionDescription(trigger: PointsAwardTrigger): string {
  if (trigger.metricName) {
    if (trigger.metricThreshold != null && trigger.metricThreshold !== undefined) {
      return `${trigger.metricName} · threshold ${Number(trigger.metricThreshold).toLocaleString()}`;
    }
    return trigger.metricName;
  }
  if (trigger.type === "achievement") {
    return trigger.achievementName ?? "Achievement";
  }
  if (trigger.type === "streak") {
    return trigger.streakLengthThreshold != null
      ? `Streak · ${trigger.streakLengthThreshold.toLocaleString()}`
      : "Streak";
  }
  if (trigger.type === "time" && trigger.timeInterval != null && trigger.timeUnit) {
    return `Every ${trigger.timeInterval} ${trigger.timeUnit}(s)`;
  }
  if (trigger.type === "user_creation") {
    return "Account created";
  }
  return trigger.type.replace(/_/g, " ");
}

function defaultFormatAwardedPoints(value: number) {
  return value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
}

function defaultFormatAwardDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.length >= 10 ? iso.slice(0, 10) : iso;
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PointsAwards = React.forwardRef<HTMLDivElement, PointsAwardsProps>(
  ({ className, awards, formatTotalPoints, formatAwardedPoints, formatDate, ...props }, ref) => {
    const formatRowDate = formatDate ?? defaultFormatAwardDate;

    return (
      <div ref={ref} className={cn("bg-card w-full rounded-xl border", className)} {...props}>
        <div role="list" aria-label="Points awards history" className="divide-border divide-y">
          {awards.map((award) => {
            const awardedLabel = formatAwardedPoints
              ? formatAwardedPoints(award.awarded)
              : defaultFormatAwardedPoints(award.awarded);
            const totalLabel = formatTotalPoints
              ? formatTotalPoints(award.total)
              : award.total.toLocaleString();
            const description = awardActionDescription(award.trigger);
            const tooltip = `${awardedLabel}: ${description}`;
            const Icon = triggerIcon(award.trigger.type);

            return (
              <div
                key={award.id}
                role="listitem"
                className="grid grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-3 py-3"
              >
                <span className="text-muted-foreground truncate text-sm">
                  {formatRowDate(award.date)}
                </span>

                <p className="flex items-center gap-2">
                  <span className="text-foreground justify-self-center font-bold tabular-nums">
                    {totalLabel}
                  </span>
                  <span className="text-success font-medium tabular-nums">{awardedLabel}</span>
                </p>

                <div className="flex items-center justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span
                          aria-label={tooltip}
                          className="bg-muted text-foreground inline-flex h-6 w-6 items-center justify-center rounded-full"
                        >
                          <Icon className="size-3" aria-hidden="true" />
                        </span>
                      }
                    />
                    <TooltipContent side="top">{tooltip}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

PointsAwards.displayName = "PointsAwards";

export type { PointsAwardsProps };
export { PointsAwards };
