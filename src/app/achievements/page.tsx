"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrophy } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AchievementGrid } from "~/components/ui/achievement-grid";
import { PointsBadge } from "~/components/ui/points-badge";
import { getUserAchievements, getUserPoints } from "~/server/gamification";
import { useUser } from "~/components/user-provider";

export default function AchievementsPage() {
  const user = useUser();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Array<{
    id: string; name: string; description: string; trigger: "metric" | "streak" | "api";
    achievedAt: string | null; progress: number; xp: number;
  }> | null>(null);
  const [points, setPoints] = useState<{ totalXP: number; level: number; progress: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    void Promise.all([getUserAchievements(), getUserPoints()]).then(([a, p]) => {
      setAchievements(a);
      if (p) setPoints(p);
    });
  }, [user]);

  if (!user) {
    router.push("/login");
    return null;
  }

  const loading = achievements === null;
  const unlocked = achievements?.filter((a) => a.achievedAt !== null) ?? [];
  const locked = achievements?.filter((a) => a.achievedAt === null) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophy className="text-primary size-5" />
          achievements
        </h1>
        <div className="flex items-center gap-3">
          {points && (
            <PointsBadge name="XP" total={points.totalXP} size="sm" />
          )}
          <Badge variant="outline">
            {unlocked.length} / {achievements?.length ?? 0} unlocked
          </Badge>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                  <IconTrophy className="text-primary size-4" /> unlocked ({unlocked.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <AchievementGrid
                  achievements={unlocked.map((a) => ({
                    id: a.id,
                    name: a.name,
                    trigger: a.trigger,
                    achievedAt: a.achievedAt,
                    progress: a.progress,
                  }))}
                  columns={4}
                  badgeSize="default"
                />
              </CardContent>
            </Card>
          )}

          {locked.length > 0 && (
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-xs font-semibold tracking-widest uppercase">
                  locked ({locked.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <AchievementGrid
                  achievements={locked.map((a) => ({
                    id: a.id,
                    name: a.name,
                    trigger: a.trigger,
                    achievedAt: null,
                    progress: a.progress,
                  }))}
                  columns={4}
                  badgeSize="default"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
