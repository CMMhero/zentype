export type GameMode = "time" | "words";
export type GameStatus = "idle" | "running" | "finished";

export interface Theme {
  name: string;
  bg: string;
  text: string;
  sub: string;
  main: string;
  caret: string;
  error: string;
}

export type CaretStyle = "line" | "block" | "underline" | "outline";
export type FontSize = "sm" | "base" | "lg" | "xl" | "2xl";

export interface GameSettings {
  mode: GameMode;
  duration: number; // 10, 15, 30, 60
  wordCount: number; // 10, 25, 50, 100
  fontFamily: "sans" | "serif" | "mono";
  themeId: string;
  caretStyle: CaretStyle;
  fontSize: FontSize;
  smoothCaret: boolean;
  hideLiveStats: boolean;
  blindMode: boolean;
}

export interface Stats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
}

export interface HistoryItem {
  id: string;
  date: string; // ISO string
  wpm: number;
  raw: number; // Raw WPM
  accuracy: number;
  consistency: number;
  mode: GameMode;
  info: string; // "30s" or "25w"
  timeline: { time: number; wpm: number; raw: number }[];
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
}

export interface CharState {
  char: string;
  status: "correct" | "incorrect" | "pending" | "extra";
}
