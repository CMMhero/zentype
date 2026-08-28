"use server";

import { getSupabaseServerClient } from "~/lib/supabase/server";
import {
  ACHIEVEMENTS,
  type AchievementCheckInput,
} from "~/lib/achievements";
import { calculateTestXP, levelFromXP, xpProgress } from "~/lib/xp";
import type { TestResult } from "~/lib/types";

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

/** Get user's total XP and level */
export async function getUserPoints(): Promise<{
  totalXP: number;
  level: number;
  progress: number;
} | null> {
  const ctx = await requireUser();
  if (!ctx) return null;
  const { data } = await ctx.supabase
    .from("user_points")
    .select("total_xp,level")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!data) return { totalXP: 0, level: 1, progress: 0 };
  return {
    totalXP: data.total_xp,
    level: data.level,
    progress: xpProgress(data.total_xp),
  };
}

/** Get user's points by username (for public profiles) */
export async function getUserPointsByUsername(
  username: string,
): Promise<{
  totalXP: number;
  level: number;
  progress: number;
} | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  // First get user_id from username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (!profile) return null;
  // Then get points
  const { data } = await supabase
    .from("user_points")
    .select("total_xp,level")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!data) return { totalXP: 0, level: 1, progress: 0 };
  return {
    totalXP: data.total_xp,
    level: data.level,
    progress: xpProgress(data.total_xp),
  };
}

/** Get user's unlocked achievements */
export async function getUserAchievements(): Promise<
  Array<{
    id: string;
    name: string;
    description: string;
    trigger: "metric" | "streak" | "api";
    achievedAt: string | null;
    progress: number;
    xp: number;
  }>
> {
  const ctx = await requireUser();
  if (!ctx) {
    return ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      trigger: a.trigger,
      achievedAt: null,
      progress: 0,
      xp: a.xp,
    }));
  }

  const { data: unlocked } = await ctx.supabase
    .from("user_achievements")
    .select("achievement_id,unlocked_at,progress");

  const unlockedMap = new Map(
    (unlocked ?? []).map((r) => [r.achievement_id, r])
  );

  // Fetch stats for progress calculation
  const stats = await buildAchievementStats(ctx.user.id, ctx.supabase);

  return ACHIEVEMENTS.map((a) => {
    const u = unlockedMap.get(a.id);
    if (u) {
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        trigger: a.trigger,
        achievedAt: u.unlocked_at,
        progress: 100,
        xp: a.xp,
      };
    }
    const raw = a.check(stats);
    const progress = typeof raw === "number" ? Math.min(100, Math.max(0, Math.round(raw))) : raw ? 100 : 0;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      trigger: a.trigger,
      achievedAt: null,
      progress,
      xp: a.xp,
    };
  });
}

/** Get point event history */
export async function getPointEvents(limit = 50): Promise<
  Array<{
    id: string;
    awarded: number;
    total: number;
    date: string;
    trigger: { id: string; type: string; points: number; achievementName?: string | null; metricName?: string | null };
  }>
> {
  const ctx = await requireUser();
  if (!ctx) return [];
  const { data: events } = await ctx.supabase
    .from("point_events")
    .select("id,awarded,total,created_at,event_type,event_data")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!events) return [];
  return events.map((e) => ({
    id: e.id,
    awarded: e.awarded,
    total: e.total,
    date: e.created_at,
    trigger: {
      id: e.id,
      type: e.event_type,
      points: e.awarded,
      achievementName: e.event_data?.["achievement_id"] as string | null ?? null,
      metricName: e.event_data?.["metric_name"] as string | null ?? null,
    },
  }));
}

/** After a test is saved, check achievements and award XP. Returns newly unlocked achievements. */
export async function processTestResult(
  result: TestResult,
): Promise<{
  xpEarned: number;
  newAchievements: Array<{ id: string; name: string; description: string; xp: number }>;
}> {
  const ctx = await requireUser();
  if (!ctx) return { xpEarned: 0, newAchievements: [] };

  const stats = await buildAchievementStats(ctx.user.id, ctx.supabase);

  // Calculate XP
  const xpEarned = calculateTestXP(result, stats.currentStreak);

  // Record XP event
  const { data: existing } = await ctx.supabase
    .from("user_points")
    .select("total_xp")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  const currentXP = existing?.total_xp ?? 0;

  await ctx.supabase.rpc("record_point_event", {
    p_user_id: ctx.user.id,
    p_awarded: xpEarned,
    p_total: currentXP + xpEarned,
    p_event_type: "test",
    p_event_data: JSON.stringify({
      metric_name: "test completed",
      wpm: result.wpm,
      accuracy: result.accuracy,
    }),
  }).then(({ error }) => {
    if (error) console.error("[zentype] record_point_event failed:", error.message);
  });

  // Check achievements
  const newAchievements: Array<{ id: string; name: string; description: string; xp: number }> = [];

  for (const a of ACHIEVEMENTS) {
    const raw = a.check(stats);
    const unlocked = typeof raw === "boolean" ? raw : raw >= 100;
    if (!unlocked) continue;

    const { data: already } = await ctx.supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", ctx.user.id)
      .eq("achievement_id", a.id)
      .maybeSingle();
    if (already) continue;

    // Unlock achievement
    await ctx.supabase.rpc("unlock_achievement", {
      p_user_id: ctx.user.id,
      p_achievement_id: a.id,
      p_xp: a.xp,
    }).then(({ error }) => {
      if (error) console.error("[zentype] unlock_achievement failed:", error.message);
    });

    newAchievements.push({ id: a.id, name: a.name, description: a.description, xp: a.xp });
  }

  return { xpEarned, newAchievements };
}

async function buildAchievementStats(
  userId: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>> & {},
): Promise<AchievementCheckInput> {
  const RESULT_COLUMNS =
    "id,created_at,mode,variant,source,wpm,raw_wpm,accuracy,consistency,chars,timeline";

  const { data: rows } = await supabase
    .from("test_results")
    .select(RESULT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(2000);

  // fetch level and account age in parallel
  const [{ data: pointsRow }, { data: profileRow }] = await Promise.all([
    supabase.from("user_points").select("total_xp").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
  ]);
  const level = pointsRow?.total_xp != null ? levelFromXP(pointsRow.total_xp as number) : 1;
  const accountAgeDays = profileRow?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(profileRow.created_at as string).getTime()) / 86400000))
    : 0;

  const results = (rows as Array<{
    created_at: string; mode: string; variant: number; wpm: number;
    accuracy: number; consistency: number; chars?: { correct?: number; incorrect?: number; extra?: number };
  }> | null) ?? [];
  if (results.length === 0) {
    return {
      testsCompleted: 0,
      timeTypedSeconds: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      bestConsistency: 0,
      avgWpm: 0,
      avgWpm10: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
      charsTyped: 0,
      currentStreak: 0,
      longestStreak: 0,
      bestByBoard: {},
      level,
      accountAgeDays,
      testsAbove60Wpm: 0,
      testsAbove80Wpm: 0,
      testsAbove90Wpm: 0,
      testsAbove100Wpm: 0,
      testsAbove120Wpm: 0,
      testsAbove95Acc: 0,
      testsAbove98Acc: 0,
      testsAbove99Acc: 0,
      testsAbove90Acc: 0,
    };
  }

  const last10 = results.slice(0, 10);
  const bestByBoard: Record<string, number> = {};
  let bestWpm = 0;
  let bestAccuracy = 0;
  let bestConsistency = 0;
  let totalWpm = 0;
  let totalAcc = 0;
  let totalCons = 0;
  let totalChars = 0;
  let totalTime = 0;
  let testsAbove60Wpm = 0;
  let testsAbove80Wpm = 0;
  let testsAbove90Wpm = 0;
  let testsAbove100Wpm = 0;
  let testsAbove120Wpm = 0;
  let testsAbove95Acc = 0;
  let testsAbove98Acc = 0;
  let testsAbove99Acc = 0;
  let testsAbove90Acc = 0;

  for (const r of results) {
    if (r.wpm > bestWpm) bestWpm = r.wpm;
    if (r.accuracy > bestAccuracy) bestAccuracy = r.accuracy;
    if (r.consistency > bestConsistency) bestConsistency = r.consistency;
    totalWpm += r.wpm;
    totalAcc += r.accuracy;
    totalCons += r.consistency;
    totalChars += (r.chars?.correct ?? 0) + (r.chars?.incorrect ?? 0) + (r.chars?.extra ?? 0);
    if (r.wpm >= 60) testsAbove60Wpm++;
    if (r.wpm >= 80) testsAbove80Wpm++;
    if (r.wpm >= 90) testsAbove90Wpm++;
    if (r.wpm >= 100) testsAbove100Wpm++;
    if (r.wpm >= 120) testsAbove120Wpm++;
    if (r.accuracy >= 95) testsAbove95Acc++;
    if (r.accuracy >= 98) testsAbove98Acc++;
    if (r.accuracy >= 99) testsAbove99Acc++;
    if (r.accuracy >= 90) testsAbove90Acc++;
    if (r.mode === "time") {
      totalTime += r.variant;
    } else {
      // words mode: estimate time from wpm and word count; fallback to 30s if wpm is 0
      const est = r.wpm > 0 ? Math.round((r.variant * 60) / r.wpm) : 30;
      totalTime += Math.min(600, Math.max(5, est));
    }
    const k = `${r.mode}:${r.variant}`;
    if (!bestByBoard[k] || r.wpm > bestByBoard[k]) bestByBoard[k] = r.wpm;
  }

  // Streak calculation
  const daySet = new Set<string>();
  for (const r of results) {
    const d = new Date(r.created_at);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  let currentStreak = 0;
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (true) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (daySet.has(key)) { currentStreak++; d.setDate(d.getDate() - 1); } else break;
  }
  let longestStreak = currentStreak;
  let run = 0;
  const sortedDays = Array.from(daySet).sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { run = 1; continue; }
    const prev = new Date(sortedDays[i - 1]);
    const cur = new Date(sortedDays[i]);
    const diff = (cur.getTime() - prev.getTime()) / 86400000;
    if (Math.abs(diff - 1) < 0.5) { run++; } else { run = 1; }
    if (run > longestStreak) longestStreak = run;
  }

  return {
    testsCompleted: results.length,
    timeTypedSeconds: totalTime,
    bestWpm,
    bestAccuracy: Math.round(bestAccuracy * 100) / 100,
    bestConsistency: Math.round(bestConsistency * 100) / 100,
    avgWpm: Math.round(totalWpm / results.length),
    avgWpm10: Math.round(last10.reduce((a, r) => a + r.wpm, 0) / last10.length),
    avgAccuracy: Math.round(totalAcc / results.length),
    avgConsistency: Math.round(totalCons / results.length),
    charsTyped: totalChars,
    currentStreak,
    longestStreak,
    bestByBoard,
    level,
    accountAgeDays,
    testsAbove60Wpm,
    testsAbove80Wpm,
    testsAbove90Wpm,
    testsAbove100Wpm,
    testsAbove120Wpm,
    testsAbove95Acc,
    testsAbove98Acc,
    testsAbove99Acc,
    testsAbove90Acc,
  };
}
