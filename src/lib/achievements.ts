export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  trigger: "metric" | "streak" | "api";
  /** XP bonus when unlocked */
  xp: number;
  /** Check function: returns progress 0–100 or true if unlocked */
  check: (stats: AchievementCheckInput) => number | boolean;
}

export interface AchievementCheckInput {
  testsCompleted: number;
  timeTypedSeconds: number;
  bestWpm: number;
  avgWpm: number;
  avgWpm10: number;
  avgAccuracy: number;
  avgConsistency: number;
  charsTyped: number;
  currentStreak: number;
  longestStreak: number;
  /** Board keys like "time:30" → best WPM */
  bestByBoard: Record<string, number>;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Test count milestones ──
  { id: "first_test", name: "First Steps", description: "Complete your first test", trigger: "api", xp: 10, check: (s) => s.testsCompleted >= 1 },
  { id: "tests_10", name: "Getting Started", description: "Complete 10 tests", trigger: "metric", xp: 25, check: (s) => Math.min(100, (s.testsCompleted / 10) * 100) },
  { id: "tests_25", name: "Quarter Century", description: "Complete 25 tests", trigger: "metric", xp: 35, check: (s) => Math.min(100, (s.testsCompleted / 25) * 100) },
  { id: "tests_50", name: "Dedicated", description: "Complete 50 tests", trigger: "metric", xp: 50, check: (s) => Math.min(100, (s.testsCompleted / 50) * 100) },
  { id: "tests_100", name: "Centurion", description: "Complete 100 tests", trigger: "metric", xp: 100, check: (s) => Math.min(100, (s.testsCompleted / 100) * 100) },
  { id: "tests_250", name: "Quarter Master", description: "Complete 250 tests", trigger: "metric", xp: 150, check: (s) => Math.min(100, (s.testsCompleted / 250) * 100) },
  { id: "tests_500", name: "Veteran", description: "Complete 500 tests", trigger: "metric", xp: 200, check: (s) => Math.min(100, (s.testsCompleted / 500) * 100) },
  { id: "tests_1000", name: "Legend", description: "Complete 1,000 tests", trigger: "metric", xp: 500, check: (s) => Math.min(100, (s.testsCompleted / 1000) * 100) },

  // ── WPM milestones ──
  { id: "wpm_30", name: "Slow & Steady", description: "Reach 30 WPM", trigger: "metric", xp: 15, check: (s) => s.bestWpm >= 30 },
  { id: "wpm_40", name: "Warming Up", description: "Reach 40 WPM", trigger: "metric", xp: 20, check: (s) => s.bestWpm >= 40 },
  { id: "wpm_50", name: "Typist", description: "Reach 50 WPM", trigger: "metric", xp: 30, check: (s) => s.bestWpm >= 50 },
  { id: "wpm_60", name: "Picking Up", description: "Reach 60 WPM", trigger: "metric", xp: 40, check: (s) => s.bestWpm >= 60 },
  { id: "wpm_70", name: "Speed Demon", description: "Reach 70 WPM", trigger: "metric", xp: 75, check: (s) => s.bestWpm >= 70 },
  { id: "wpm_80", name: "Quick Typer", description: "Reach 80 WPM", trigger: "metric", xp: 100, check: (s) => s.bestWpm >= 80 },
  { id: "wpm_90", name: "Blazing Fingers", description: "Reach 90 WPM", trigger: "metric", xp: 120, check: (s) => s.bestWpm >= 90 },
  { id: "wpm_100", name: "Century", description: "Reach 100 WPM", trigger: "metric", xp: 150, check: (s) => s.bestWpm >= 100 },
  { id: "wpm_120", name: "Blazing", description: "Reach 120 WPM", trigger: "metric", xp: 250, check: (s) => s.bestWpm >= 120 },
  { id: "wpm_150", name: "Lightning Fingers", description: "Reach 150 WPM", trigger: "metric", xp: 500, check: (s) => s.bestWpm >= 150 },
  { id: "wpm_200", name: "Inhuman", description: "Reach 200 WPM", trigger: "metric", xp: 1000, check: (s) => s.bestWpm >= 200 },

  // ── Accuracy milestones ──
  { id: "acc_90", name: "Sharpshooter", description: "Get 90%+ accuracy on a test", trigger: "metric", xp: 20, check: (s) => s.avgAccuracy >= 90 },
  { id: "acc_95", name: "Precision", description: "Get 95%+ accuracy on a test", trigger: "metric", xp: 50, check: (s) => s.avgAccuracy >= 95 },
  { id: "acc_99", name: "Perfectionist", description: "Get 99%+ accuracy on a test", trigger: "metric", xp: 200, check: (s) => s.avgAccuracy >= 99 },
  { id: "acc_100", name: "Flawless", description: "Get 100% accuracy on a test", trigger: "api", xp: 500, check: (s) => s.avgAccuracy >= 100 },

  // ── Consistency milestones ──
  { id: "cons_80", name: "Steady Hand", description: "Reach 80%+ consistency", trigger: "metric", xp: 25, check: (s) => s.avgConsistency >= 80 },
  { id: "cons_90", name: "Rock Solid", description: "Reach 90%+ consistency", trigger: "metric", xp: 75, check: (s) => s.avgConsistency >= 90 },
  { id: "cons_95", name: "Machine", description: "Reach 95%+ consistency", trigger: "metric", xp: 200, check: (s) => s.avgConsistency >= 95 },

  // ── Streak milestones ──
  { id: "streak_3", name: "On a Roll", description: "Type for 3 days in a row", trigger: "streak", xp: 30, check: (s) => s.currentStreak >= 3 || s.longestStreak >= 3 },
  { id: "streak_7", name: "Week Warrior", description: "Type for 7 days in a row", trigger: "streak", xp: 75, check: (s) => s.currentStreak >= 7 || s.longestStreak >= 7 },
  { id: "streak_14", name: "Fortnight Focus", description: "Type for 14 days in a row", trigger: "streak", xp: 150, check: (s) => s.currentStreak >= 14 || s.longestStreak >= 14 },
  { id: "streak_21", name: "Three Week Titan", description: "Type for 21 days in a row", trigger: "streak", xp: 225, check: (s) => s.currentStreak >= 21 || s.longestStreak >= 21 },
  { id: "streak_30", name: "Monthly Master", description: "Type for 30 days in a row", trigger: "streak", xp: 300, check: (s) => s.currentStreak >= 30 || s.longestStreak >= 30 },
  { id: "streak_50", name: "Half Century Streak", description: "Type for 50 days in a row", trigger: "streak", xp: 600, check: (s) => s.currentStreak >= 50 || s.longestStreak >= 50 },
  { id: "streak_100", name: "Daily Legend", description: "Type for 100 days in a row", trigger: "streak", xp: 1000, check: (s) => s.currentStreak >= 100 || s.longestStreak >= 100 },

  // ── Time milestones ──
  { id: "time_1h", name: "Dedicated Hour", description: "Type for 1 hour total", trigger: "metric", xp: 30, check: (s) => s.timeTypedSeconds >= 3600 },
  { id: "time_10h", name: "Marathon Runner", description: "Type for 10 hours total", trigger: "metric", xp: 100, check: (s) => s.timeTypedSeconds >= 36000 },
  { id: "time_100h", name: "Typing Addict", description: "Type for 100 hours total", trigger: "metric", xp: 500, check: (s) => s.timeTypedSeconds >= 360000 },

  // ── Characters milestones ──
  { id: "chars_10k", name: "Wordsmith", description: "Type 10,000 characters", trigger: "metric", xp: 25, check: (s) => s.charsTyped >= 10000 },
  { id: "chars_100k", name: "Prolific", description: "Type 100,000 characters", trigger: "metric", xp: 100, check: (s) => s.charsTyped >= 100000 },
  { id: "chars_1m", name: "Novelist", description: "Type 1,000,000 characters", trigger: "metric", xp: 500, check: (s) => s.charsTyped >= 1000000 },

  // ── Board-specific ──
  { id: "board_time15_100", name: "Sprint Master", description: "Reach 100 WPM on 15s time", trigger: "metric", xp: 100, check: (s) => (s.bestByBoard["time:15"] ?? 0) >= 100 },
  { id: "board_time60_80", name: "Endurance", description: "Reach 80 WPM on 60s time", trigger: "metric", xp: 100, check: (s) => (s.bestByBoard["time:60"] ?? 0) >= 80 },
  { id: "board_words10_90", name: "Quick Fingers", description: "Reach 90 WPM on 10 words", trigger: "metric", xp: 75, check: (s) => (s.bestByBoard["words:10"] ?? 0) >= 90 },
  { id: "board_words100_70", name: "Marathon Typist", description: "Reach 70 WPM on 100 words", trigger: "metric", xp: 100, check: (s) => (s.bestByBoard["words:100"] ?? 0) >= 70 },

  // ── Special ──
  { id: "avg_80", name: "Consistent Performer", description: "Maintain 80+ avg WPM", trigger: "metric", xp: 150, check: (s) => s.avgWpm >= 80 },
  { id: "avg_100", name: "Elite Typist", description: "Maintain 100+ avg WPM", trigger: "metric", xp: 500, check: (s) => s.avgWpm >= 100 },
];

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
