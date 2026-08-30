import type { CharCounts, TimelinePoint } from "~/lib/types";

/**
 * Pure typing-test math. All formulas follow monkeytype conventions:
 *
 *  raw WPM      = (all typed chars incl. incorrect + spaces) / 5 / minutes
 *  net WPM      = (correct chars incl. correct spaces) / 5 / minutes
 *  accuracy     = correct keystrokes / total keystrokes   (backspaces excluded)
 *  consistency  = kogasa(cv) of per-second raw-WPM samples
 */

export interface KeystrokeState {
  /** every printable keystroke, backspaces excluded */
  total: number;
  /** keystrokes that did not match the expected character */
  errors: number;
}

export function charBreakdown(
  words: readonly string[],
  history: readonly string[],
  current: string,
): CharCounts {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (let i = 0; i < history.length; i++) {
    const typed = history[i];
    const target = words[i] ?? "";
    if (!typed) {
      missed += target.length;
      continue;
    }
    const n = Math.min(typed.length, target.length);
    for (let c = 0; c < n; c++) {
      if (typed[c] === target[c]) correct++;
      else incorrect++;
    }
    if (typed.length > target.length) extra += typed.length - target.length;
    if (typed.length < target.length) missed += target.length - typed.length;

    // a fully-correct word earns its trailing space
    if (typed === target && i < history.length - 1) correct++;
  }

  // current in-flight word
  const target = words[history.length] ?? "";
  const n = Math.min(current.length, target.length);
  for (let c = 0; c < n; c++) {
    if (current[c] === target[c]) correct++;
    else incorrect++;
  }
  if (current.length > target.length) extra += current.length - target.length;

  return { correct, incorrect, extra, missed };
}

/** Net (correct-inclusive-of-spaces) characters — mirrors charBreakdown credit rules. */
export function netCorrectChars(counts: CharCounts): number {
  return counts.correct;
}

export function wpm(correctChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.max(0, Math.round(correctChars / 5 / (seconds / 60)));
}

/**
 * Monkeytype's "kogasa" consistency: maps the coefficient of variation of
 * per-second raw-WPM samples to 0..100.
 */
export function consistency(samples: readonly number[]): number {
  if (samples.length < 2) return 100;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean <= 0) return 100;
  const variance =
    samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
  const cv = Math.sqrt(variance) / mean;
  const kogasa =
    100 * (1 - Math.tanh(cv + cv ** 3 / 3 + cv ** 5 / 5));
  return clampRound(kogasa);
}

function clampRound(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function finalStats(args: {
  counts: CharCounts;
  keystrokes: KeystrokeState;
  seconds: number;
  samples: readonly number[];
}) {
  const { counts, keystrokes, seconds, samples } = args;
  const t = Math.max(seconds, 0.001);
  return {
    wpm: wpm(counts.correct, t),
    rawWpm: wpm(keystrokes.total, t),
    accuracy:
      keystrokes.total > 0
        ? clampRound(((keystrokes.total - keystrokes.errors) / keystrokes.total) * 100)
        : 100,
    consistency: consistency(samples),
    chars: counts,
  };
}

/** Server-side sanity check before persisting a result. */
export function isPlausible(result: {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  variant: number;
  mode: string;
  timeline: TimelinePoint[];
  chars?: { correct: number; incorrect: number; extra: number; missed: number };
}): boolean {
  if (!Number.isFinite(result.wpm) || result.wpm < 0 || result.wpm > 400)
    return false;
  if (!Number.isFinite(result.rawWpm) || result.rawWpm < 0 || result.rawWpm > 450)
    return false;
  if (!Number.isFinite(result.accuracy) || result.accuracy < 0 || result.accuracy > 100)
    return false;
  const minSeconds = result.mode === "time" ? Math.min(result.variant, 10) : 3;
  if (result.timeline.length > 0 && result.timeline[result.timeline.length - 1].t < minSeconds - 1)
    return false;

  // AFK detection: reject tests where barely any real typing happened
  if (result.chars) {
    const { correct, incorrect } = result.chars;
    const totalKeystrokes = correct + incorrect;
    const lastT = result.timeline.length > 0 ? result.timeline[result.timeline.length - 1].t : 0;

    // Essentially no keystrokes at all
    if (totalKeystrokes < 5) return false;

    // Very low keystroke rate (< 1 char/sec sustained) — likely AFK
    if (lastT >= 5 && totalKeystrokes / lastT < 1) return false;

    // WPM < 5 with meaningful duration — not actually typing
    if (lastT >= 5 && result.wpm < 5) return false;
  }

  return true;
}
