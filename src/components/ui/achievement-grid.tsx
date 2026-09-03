"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { AchievementBadge } from "~/components/ui/achievement-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description?: string | null;
  trigger: "metric" | "api" | "streak";
  badgeUrl?: string | null;
  progress?: number;
  rarity?: number;
}

interface UserAchievement extends Achievement {
  achievedAt: string | null;
}

const achievementGridVariants = cva("grid", {
  variants: {
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-2 sm:grid-cols-4",
      auto: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    },
    gap: {
      sm: "gap-2",
      default: "gap-4",
      lg: "gap-6",
    },
  },
  defaultVariants: {
    columns: "auto",
    gap: "default",
  },
});

interface AchievementGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof achievementGridVariants> {
  achievements: UserAchievement[];
  badgeSize?: "sm" | "default" | "lg";
  onAchievementClick?: (achievement: UserAchievement) => void;
}

const AchievementGrid = React.forwardRef<HTMLDivElement, AchievementGridProps>(
  (
    { className, columns, gap, achievements, badgeSize = "default", onAchievementClick, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="list"
        aria-label="Achievements"
        className={cn(achievementGridVariants({ columns, gap }), className)}
        {...props}
      >
        {achievements.map((achievement) => {
          const tooltipContent =
            achievement.description || (achievement.achievedAt ? "Earned" : "Locked");
          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger
                render={
                  <div>
                    <AchievementBadge
                      achievement={achievement}
                      badgeSize={badgeSize}
                      onAchievementClick={onAchievementClick}
                    />
                  </div>
                }
              />
              <TooltipContent
                side="top"
                className="flex max-w-[220px] flex-col gap-0.5 text-center"
              >
                <p className="font-medium">{achievement.name}</p>
                <p className="text-background/70">{tooltipContent}</p>
                {achievement.rarity != null && (
                  <p className="text-background/70">{achievement.rarity}% of users</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  },
);
AchievementGrid.displayName = "AchievementGrid";

export type { Achievement, AchievementGridProps, UserAchievement };
export { AchievementGrid, achievementGridVariants };
