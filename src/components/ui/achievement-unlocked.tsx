"use client";

import { IconCalendar, IconShare2, IconX } from "@tabler/icons-react";
import * as React from "react";
import { AchievementBadge, type UserAchievement } from "~/components/ui/achievement-badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Achievement {
  id: string;
  name: string;
  trigger?: "metric" | "api" | "streak";
  description?: string | null;
  unlockedAt?: string;
}

interface AchievementUnlockedProps {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  onShare?: () => void;
  className?: string;
}

const AchievementUnlocked = React.forwardRef<HTMLDivElement, AchievementUnlockedProps>(
  (
    {
      achievement,
      open,
      onOpenChange,
      secondaryActionLabel = "Share",
      onSecondaryActionClick,
      onShare,
      className,
    },
    ref,
  ) => {
    const handleSecondaryActionClick = onSecondaryActionClick ?? onShare;
    const unlockedDateLabel = React.useMemo(() => {
      const input = achievement.unlockedAt ?? new Date().toISOString();
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) return "Earned today";
      return `Earned ${date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }, [achievement.unlockedAt]);

    const badgeAchievement = React.useMemo<UserAchievement>(() => {
      return {
        id: achievement.id,
        name: achievement.name,
        trigger: achievement.trigger ?? "streak",
        achievedAt: achievement.unlockedAt ?? new Date().toISOString(),
      };
    }, [achievement]);

    React.useEffect(() => {
      if (!open) return;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onOpenChange]);

    React.useEffect(() => {
      // Lock the viewport scroll directly on the root element; body-level
      // locking depends on overflow propagation to the viewport and is less
      // reliable across browsers.
      const root = document.documentElement;
      if (open) {
        root.style.overflow = "hidden";
      } else {
        root.style.overflow = "";
      }
      return () => {
        root.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-title"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md rounded-4xl bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 dark:ring-foreground/10",
            className,
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-4 right-4 bg-secondary"
          >
            <IconX className="size-4" />
          </Button>

          <div className="flex flex-col items-center text-center">
            <AchievementBadge
              achievement={badgeAchievement}
              badgeSize="xl"
              className="mb-12 mt-8 border-0 bg-transparent p-0 shadow-none [&>span:last-child]:hidden"
            />

            <span className="mb-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <IconCalendar className="size-4" />
              {unlockedDateLabel}
            </span>

            <h2 id="achievement-title" className="mb-2 text-4xl font-bold tracking-tight">
              {achievement.name}
            </h2>

            {achievement.description && (
              <p className="mb-3 text-lg text-muted-foreground">{achievement.description}</p>
            )}

            <div className="mt-8 flex gap-3">
              {handleSecondaryActionClick && (
                <Button variant="outline" size="lg" onClick={handleSecondaryActionClick}>
                  <IconShare2 className="size-4" />
                  {secondaryActionLabel}
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Awesome!</Button>
            </div>
          </div>
        </div>
      </>
    );
  },
);
AchievementUnlocked.displayName = "AchievementUnlocked";

export type { Achievement, AchievementUnlockedProps };
export { AchievementUnlocked };
