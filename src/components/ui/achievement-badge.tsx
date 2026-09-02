"use client"

import * as React from "react"
import { IconCheck, IconTrophy } from "@tabler/icons-react"

import { cn } from "~/lib/utils"

interface Achievement {
  id: string
  name: string
  trigger: "metric" | "api" | "streak"
  badgeUrl?: string | null
  progress?: number
  rarity?: number
}

interface UserAchievement extends Achievement {
  /** ISO date when earned, or `null` if locked */
  achievedAt: string | null
}

interface AchievementBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  achievement: UserAchievement
  badgeSize?: "xs" | "sm" | "default" | "lg" | "xl"
  onAchievementClick?: (achievement: UserAchievement) => void
}

const badgeSizeMap = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  default: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const

const iconSizeMap = {
  xs: "h-5 w-5",
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const

const progressRingSizeMap = {
  xs: 52,
  sm: 72,
  default: 88,
  lg: 104,
  xl: 136,
} as const

const AchievementBadge = React.forwardRef<
  HTMLDivElement,
  AchievementBadgeProps
>(
  (
    {
      className,
      achievement,
      badgeSize = "default",
      onAchievementClick,
      ...props
    },
    ref
  ) => {
    const isUnlocked = achievement.achievedAt !== null

    const hasProgress = typeof achievement.progress === "number" && (achievement.progress ?? 0) > 0 && (achievement.progress ?? 0) < 100
    const progress = hasProgress
      ? Math.min(100, Math.max(0, achievement.progress ?? 0))
      : 0
    const hasRarity = typeof achievement.rarity === "number"
    const rarity = hasRarity
      ? Math.min(100, Math.max(1, Math.round(achievement.rarity ?? 1)))
      : null
    const ringSize = progressRingSizeMap[badgeSize]
    const ringStrokeWidth = 4
    const ringRadius = (ringSize - ringStrokeWidth) / 2
    const ringCircumference = 2 * Math.PI * ringRadius
    const ringDashoffset =
      ringCircumference - (progress / 100) * ringCircumference

    const statusLabel = isUnlocked ? "Earned" : "Locked"
    const itemLabel = `${achievement.name} - ${statusLabel}`

    return (
      <div
        ref={ref}
        role={onAchievementClick ? "button" : "listitem"}
        aria-label={onAchievementClick ? itemLabel : undefined}
        tabIndex={onAchievementClick ? 0 : undefined}
        onClick={() => onAchievementClick?.(achievement)}
        onKeyDown={
          onAchievementClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onAchievementClick(achievement)
                }
              }
            : undefined
        }
        className={cn(
          "relative flex flex-col items-center justify-center gap-1 rounded-4xl bg-card ring-1 ring-foreground/5 transition-all duration-200 dark:ring-foreground/10",
          badgeSize === "xs" ? "h-20 w-20 p-2 gap-1" : badgeSize === "sm" ? "h-28 w-full p-4 gap-2" : "h-32 w-full p-4 gap-2",
          onAchievementClick && "cursor-pointer hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isUnlocked
            ? "shadow-sm ring-primary/20 hover:shadow-md hover:ring-primary/40"
            : "bg-muted/20 opacity-60 grayscale hover:opacity-80",
          className
        )}
        {...props}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            width: hasProgress ? `${ringSize}px` : undefined,
            height: hasProgress ? `${ringSize}px` : undefined,
          }}
        >
          {hasProgress ? (
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${ringSize} ${ringSize}`}
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="var(--primary)"
                strokeLinecap="round"
                strokeWidth={ringStrokeWidth}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashoffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </svg>
          ) : null}

          {achievement.badgeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={achievement.badgeUrl}
              alt={`${achievement.name} badge - ${statusLabel}`}
              className={cn(
                badgeSizeMap[badgeSize],
                "relative z-10 rounded-full object-cover",
                !isUnlocked && "grayscale opacity-70"
              )}
            />
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                badgeSizeMap[badgeSize],
                "relative z-10 flex items-center justify-center rounded-full shadow-sm",
                isUnlocked
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground grayscale"
              )}
            >
              <IconTrophy className={iconSizeMap[badgeSize]} />
            </div>
          )}
          {isUnlocked && (
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-card shadow-sm">
              <IconCheck className="size-2.5" />
            </span>
          )}
        </div>

        {rarity !== null ? (
          <span className="text-muted-foreground text-xs font-medium">
            {rarity}% of users
          </span>
        ) : null}

        <span
          className={cn(
            "text-center leading-tight font-bold",
            badgeSize === "xs" ? "text-[9px]" : "text-sm",
            !isUnlocked && "text-muted-foreground"
          )}
        >
          {achievement.name}
        </span>
      </div>
    )
  }
)
AchievementBadge.displayName = "AchievementBadge"

export { AchievementBadge }
export type { AchievementBadgeProps, Achievement, UserAchievement }
