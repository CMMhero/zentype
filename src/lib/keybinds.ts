/**
 * Single source of truth for all keybinds.
 * Used by settings page, help dialog, and command palette.
 */
export interface Keybind {
  keys: string[];
  action: string;
  /** Extra search terms for the command palette */
  keywords?: string[];
}

export const KEYBINDS: Keybind[] = [
  // Test controls
  { keys: ["tab"], action: "new test", keywords: ["restart", "new", "reset"] },
  { keys: ["esc"], action: "cancel test (no results saved)", keywords: ["cancel", "escape", "abort", "stop"] },
  { keys: ["backspace"], action: "fix current word", keywords: ["backspace", "delete", "fix", "word", "undo"] },
  { keys: ["ctrl", "backspace"], action: "delete whole word", keywords: ["ctrl", "backspace", "delete", "word"] },
  { keys: ["space"], action: "submit word", keywords: ["space", "submit", "word", "next"] },

  // Navigation
  { keys: ["alt", "1"], action: "test page", keywords: ["navigate", "test"] },
  { keys: ["alt", "2"], action: "leaderboard", keywords: ["navigate", "leaderboard"] },
  { keys: ["alt", "3"], action: "profile", keywords: ["navigate", "profile"] },
  { keys: ["alt", "4"], action: "settings", keywords: ["navigate", "settings"] },

  // App
  { keys: ["ctrl", "k"], action: "command palette", keywords: ["command", "palette", "search"] },
  { keys: ["?"], action: "open keybinds", keywords: ["keybinds", "shortcuts", "help"] },
];

/** Navigation keybinds (used in command palette navigate group) */
export const NAV_KEYBINDS = KEYBINDS.filter((k) =>
  k.keys[0] === "alt" && k.keys[1] !== undefined,
);

/** Action keybinds (everything except navigation) */
export const ACTION_KEYBINDS = KEYBINDS.filter(
  (k) => !k.keys.includes("alt"),
);
