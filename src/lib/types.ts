export type GameMode = "time" | "words";
export type PromptSource = "words";
export type CaretStyle = "line" | "block" | "underline" | "off";
export type FontSizeKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type SoundVariant = "click" | "thock" | "beep";
export type FontFamily =
  | "advent-pro" | "alfa-slab-one" | "anonymous-pro" | "archivo" | "asap"
  | "atkinson-hyperlegible" | "baloo-2" | "barlow" | "bitter" | "bricolage-grotesque"
  | "cabin" | "cal-sans" | "cascadia-code" | "caveat" | "chivo" | "comic-neue"
  | "commit-mono" | "comfortaa" | "coming-soon" | "courier-prime" | "crimson-pro"
  | "dancing-script" | "dm-sans" | "domine" | "exo-2" | "figtree" | "fira-code"
  | "fira-sans" | "fredoka" | "geist" | "geist-mono" | "gelasio" | "google-sans"
  | "ibm-plex-mono" | "ibm-plex-sans" | "inconsolata" | "inter" | "itim" | "iosevka"
  | "jetbrains-mono" | "josefin-sans" | "karla" | "lato" | "lexend" | "lobster" | "lora"
  | "manrope" | "merriweather" | "mona-sans" | "montserrat" | "noto-sans" | "noto-serif"
  | "nunito" | "nunito-sans" | "opendyslexic" | "open-sans" | "oswald" | "outfit"
  | "oxygen" | "pacifico" | "petrona" | "playfair-display" | "plus-jakarta-sans"
  | "poppins" | "pt-sans" | "pt-serif" | "quicksand" | "raleway" | "red-hat-display"
  | "red-hat-mono" | "roboto" | "roboto-flex" | "roboto-mono" | "roboto-slab" | "rubik"
  | "sarabun" | "shantell-sans" | "sora" | "source-code-pro" | "space-grotesk"
  | "space-mono" | "titillium-web" | "ubuntu" | "ubuntu-mono" | "urbanist"
  | "victor-mono" | "work-sans";

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  variant: SoundVariant;
}

export interface GameSettings {
  mode: GameMode;
  duration: number;
  wordCount: number;
  source: PromptSource;
  blindMode: boolean;
  stopOnError: boolean;
  strictSpace: boolean;
  freeBackspace: boolean;
  sound: SoundSettings;
  soundOnError: boolean;
  themeId: string;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  fontSize: FontSizeKey;
  fontFamily: FontFamily;
  showKeyboard: boolean;
  visibleLines: 1 | 2 | 3;
  hideLiveStats: boolean;
  punctuation: boolean;
  numbers: boolean;
}

export interface CharCounts {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
}

export interface TimelinePoint {
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

/** A finished test, identical shape locally and in Postgres. */
export interface TestResult {
  id: string;
  createdAt: string;
  mode: GameMode;
  /** seconds (time mode) or word count (words mode) */
  variant: number;
  source: PromptSource;
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: CharCounts;
  timeline: TimelinePoint[];
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export interface UserStats {
  testsStarted?: never;
  testsCompleted: number;
  timeTypedSeconds: number;
  bestWpm: Record<string, number>;
  avgWpm10: number;
  avgWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
  charsTyped: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  wpm: number;
  accuracy: number;
  consistency: number;
  createdAt: string;
}

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export const SOURCE_LABELS: Record<PromptSource, string> = {
  words: "english",
};

export function modeLabel(result: Pick<TestResult, "mode" | "variant">) {
  return result.mode === "time"
    ? `time ${result.variant}`
    : `words ${result.variant}`;
}

export function boardKey(mode: GameMode, variant: number) {
  return `${mode}:${variant}`;
}
