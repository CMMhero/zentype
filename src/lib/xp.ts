import type { TestResult } from "~/lib/types";

/**
 * Calculate XP earned from a test result.
 * MonkeyType-style formula:
 *   base = wpm * 0.5
 *   accuracy multiplier: 0.6–1.0 based on accuracy
 *   mode bonus: time modes get slight boost for longer tests
 *   streak bonus: +5% per streak day (capped at +50%)
 */
export function calculateTestXP(result: TestResult, currentStreak: number): number {
  const wpm = result.wpm;
  const acc = result.accuracy;

  // base XP from WPM
  let xp = Math.round(wpm * 0.5);

  // accuracy multiplier (60%–100%)
  const accMultiplier = 0.6 + (acc / 100) * 0.4;
  xp = Math.round(xp * accMultiplier);

  // mode bonus: longer tests earn more
  const modeBonus = result.mode === "time"
    ? 1 + Math.min(0.5, result.variant / 240) // up to +50% for 120s
    : 1 + Math.min(0.3, result.variant / 300); // up to +30% for 100w
  xp = Math.round(xp * modeBonus);

  // streak bonus: +5% per day, capped at +50%
  const streakBonus = 1 + Math.min(0.5, currentStreak * 0.05);
  xp = Math.round(xp * streakBonus);

  // perfect accuracy bonus
  if (acc === 100) xp += 20;

  // minimum 1 XP
  return Math.max(1, xp);
}

/** XP required to reach a given level. Level N requires N*500 total XP. */
export function xpForLevel(level: number): number {
  return level * 500;
}

/** Calculate level from total XP. */
export function levelFromXP(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / 500) + 1);
}

/** XP progress within current level (0–100). */
export function xpProgress(totalXP: number): number {
  const level = levelFromXP(totalXP);
  const baseXP = (level - 1) * 500;
  const remaining = totalXP - baseXP;
  return Math.min(100, Math.round((remaining / 500) * 100));
}
