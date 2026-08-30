"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconFlame } from "@tabler/icons-react"

import { cn } from "~/lib/utils"

// Types (inlined - only fields used by this component)
interface StreakResponse {
  length: number
  frequency: "daily" | "weekly" | "monthly"
}

// Variants
const streakBadgeVariants = cva(
  "inline-flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-card text-center text-card-foreground transition-colors",
  {
    variants: {
      size: {
        sm: "w-28 gap-1.5 p-3",
        default: "w-40 gap-2.5 p-5",
        lg: "w-52 gap-3 p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

// Props
interface StreakBadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakBadgeVariants> {
  /** Streak length value */
  length?: number
  /** Streak frequency used for label rendering */
  frequency?: StreakResponse["frequency"]
  /** Optional subtitle shown below streak length */
  subtitle?: string
  /** Custom icon to replace flame */
  icon?: React.ReactNode
}

const StreakBadge = React.forwardRef<HTMLDivElement, StreakBadgeProps>(
  (
    { className, size, length, frequency = "daily", subtitle, icon, ...props },
    ref
  ) => {
    const streakLength = length ?? 0

    // GitHub-style intensity: 0=none, 1-2=low, 3-6=mid-low, 7-13=mid, 14-29=high, 30+=max
    const streakLevel =
      streakLength === 0
        ? 0
        : streakLength <= 2
          ? 1
          : streakLength <= 6
            ? 2
            : streakLength <= 13
              ? 3
              : streakLength <= 29
                ? 4
                : 5

    const flameColors: Record<number, string> = {
      0: "text-muted-foreground",
      1: "text-amber-300",
      2: "text-amber-400",
      3: "text-amber-500",
      4: "text-orange-500",
      5: "text-red-500",
    }

    const bgColors: Record<number, string> = {
      0: "",
      1: "bg-amber-300/5 border-amber-300/20",
      2: "bg-amber-400/8 border-amber-400/25",
      3: "bg-amber-500/10 border-amber-500/30",
      4: "bg-orange-500/10 border-orange-500/30",
      5: "bg-red-500/10 border-red-500/30",
    }

    const frequencyLabel = {
      daily: "day",
      weekly: "week",
      monthly: "month",
    }[frequency]

    const pluralLabel =
      streakLength === 1 ? frequencyLabel : `${frequencyLabel}s`

    const iconSize = {
      sm: "h-10 w-10",
      default: "h-16 w-16",
      lg: "h-20 w-20",
    }[size ?? "default"]

    const valueSize = {
      sm: "text-2xl",
      default: "text-5xl",
      lg: "text-6xl",
    }[size ?? "default"]

    const subtitleSize = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    }[size ?? "default"]

    const subtitleText = subtitle ?? "streak"
    const valueUnit = pluralLabel

    // Build accessible label
    const ariaLabel = `${streakLength} ${pluralLabel} streak`

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        className={cn(streakBadgeVariants({ size }), bgColors[streakLevel], className)}
        {...props}
      >
        {icon ?? (
          <IconFlame
            className={cn(iconSize, "shrink-0", flameColors[streakLevel])}
            aria-hidden="true"
          />
        )}
        <span
          className={cn("font-semibold tracking-tight", valueSize)}
          aria-hidden="true"
        >
          {streakLength}
          <span className="text-muted-foreground ml-2 font-medium">
            {valueUnit}
          </span>
        </span>
        <span
          className={cn("text-muted-foreground font-normal", subtitleSize)}
          aria-hidden="true"
        >
          {subtitleText}
        </span>
      </div>
    )
  }
)
StreakBadge.displayName = "StreakBadge"

export { StreakBadge, streakBadgeVariants }
export type { StreakBadgeProps, StreakResponse }
