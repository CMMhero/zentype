import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { charBreakdown, finalStats, type KeystrokeState } from "~/lib/stats";
import type { CharCounts, GameSettings, TimelinePoint } from "~/lib/types";

export type EngineStatus = "idle" | "running" | "finished";

/** Minimal key info so both React events and window listeners work. */
export interface KeyEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault(): void;
}

export interface EngineResult {
  mode: GameSettings["mode"];
  variant: number;
  source: GameSettings["source"];
  punctuation: boolean;
  numbers: boolean;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: CharCounts;
  timeline: TimelinePoint[];
}

export interface UseTypingEngineOptions {
  words: string[];
  settings: GameSettings;
  /** fired whenever an incorrect keystroke lands (for sounds/effects) */
  onError?: () => void;
  /** fired on every accepted printable keystroke */
  onKeypress?: () => void;
  onFinish: (result: Omit<EngineResult, never>) => void;
}

function wpmOf(chars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.max(0, Math.round(chars / 5 / (seconds / 60)));
}

const ZERO_KEYS: KeystrokeState = { total: 0, errors: 0 };

export function useTypingEngine({
  words,
  settings,
  onError,
  onKeypress,
  onFinish,
}: UseTypingEngineOptions) {
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [history, setHistory] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  /** render-visible mirror of the keystroke counters (kept pure) */
  const [keysView, setKeysView] = useState<KeystrokeState>(ZERO_KEYS);

  /* authoritative mutable counters — only touched in callbacks/effects */
  const keys = useRef<KeystrokeState>({ total: 0, errors: 0 });
  const startRef = useRef(0);
  const endRef = useRef(0);
  const secondMarkRef = useRef({ index: 0, total: 0 });
  const samplesRef = useRef<number[]>([]);
  const errorsPerSecondRef = useRef<Record<number, number>>({});
  const timelineRef = useRef<TimelinePoint[]>([]);
  /** mirrors of latest values for interval/sampling access */
  const liveRef = useRef({ history: [] as string[], current: "", words });

  useEffect(() => {
    liveRef.current = { history, current, words };
  }, [history, current, words]);

  /* ---------- live aggregates (pure derivations) ---------- */

  const counts = useMemo(
    () => charBreakdown(words, history, current),
    [words, history, current],
  );

  const secondsElapsed =
    status === "finished" && finalSeconds !== null
      ? finalSeconds
      : status === "running"
        ? Math.max(elapsedMs / 1000, 0.001)
        : 0;

  const liveWpm =
    secondsElapsed > 1 ? Math.round(counts.correct / 5 / (secondsElapsed / 60)) : 0;
  const liveRaw =
    secondsElapsed > 1
      ? Math.round(keysView.total / 5 / (secondsElapsed / 60))
      : 0;
  const liveAcc =
    keysView.total > 0
      ? Math.max(
          0,
          Math.round(((keysView.total - keysView.errors) / keysView.total) * 100),
        )
      : 100;

  const progress =
    settings.mode === "time"
      ? Math.min(1, elapsedMs / 1000 / settings.duration)
      : (() => {
          // Word-count baseline: can never exceed actual words completed
          const wordBaseline = Math.min(1, history.length / settings.wordCount);
          // Character-based smoothness within the current word
          const targetWord = words[history.length] ?? "";
          const charInWord = targetWord.length > 0
            ? Math.min(1, counts.correctInCurrentWord / targetWord.length)
            : 0;
          // Each word contributes 1/wordCount; current word fills its slot smoothly
          const charProgress = (history.length + charInWord) / settings.wordCount;
          // Clamp to word baseline so it can't jump ahead
          return Math.min(wordBaseline + (charProgress - wordBaseline), 1);
        })();

  const timeLeft = Math.max(0, settings.duration - elapsedMs / 1000);

  /* ---------- shared helpers ---------- */

  const recordKey = useCallback((wrong: boolean) => {
    keys.current.total++;
    if (wrong) keys.current.errors++;
    setKeysView({ ...keys.current });
    const passed =
      startRef.current > 0 ? (Date.now() - startRef.current) / 1000 : 0;
    const si = Math.floor(passed);
    if (wrong) errorsPerSecondRef.current[si] = (errorsPerSecondRef.current[si] ?? 0) + 1;
  }, []);

  const statusRef = useRef<EngineStatus>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const finish = useCallback(() => {
    if (statusRef.current !== "running") return;
    statusRef.current = "finished";
    endRef.current = Date.now();
    const seconds = Math.max((endRef.current - startRef.current) / 1000, 0.001);
    setFinalSeconds(seconds);

    const snap = liveRef.current;
    const c = charBreakdown(snap.words, snap.history, snap.current);
    const stats = finalStats({
      counts: c,
      keystrokes: keys.current,
      seconds,
      samples: samplesRef.current,
    });

    const totalErrors = Object.values(errorsPerSecondRef.current).reduce(
      (a, b) => a + b,
      0,
    );
    const tl: TimelinePoint[] = [
      ...timelineRef.current,
      {
        t: Math.round(seconds),
        wpm: stats.wpm,
        raw: stats.rawWpm,
        errors: totalErrors,
      },
    ];
    timelineRef.current = tl;
    setTimeline(tl);
    setStatus("finished");

    onFinish({
      mode: settings.mode,
      variant: settings.mode === "time" ? settings.duration : settings.wordCount,
      source: settings.source,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      consistency: stats.consistency,
      chars: stats.chars,
      timeline: tl,
    });
  }, [onFinish, settings.mode, settings.duration, settings.wordCount, settings.source, settings.punctuation, settings.numbers]);

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  const resetRef = useRef<() => void>(() => {});

  /* ---------- sampling loop (single 100ms tick, 1s buckets) ---------- */

  useEffect(() => {
    if (status !== "running") return;
    const iv = window.setInterval(() => {
      if (!startRef.current) return; // test not actually started yet
      const now = Date.now();
      const passed = (now - startRef.current) / 1000;
      setElapsedMs(now - startRef.current);

      // close every fully-elapsed second bucket.
      // read the mark fresh each iteration — caching it outside the loop
      // makes the condition compare against a stale index forever.
      const secIdx = Math.floor(passed);
      let guard = 0;
      while (secIdx > secondMarkRef.current.index && guard++ < 10) {
        const prev = secondMarkRef.current;
        const nextIndex = prev.index + 1;
        const bucketSeconds = Math.min(passed, nextIndex) - prev.index || 0.001;
        const dTotal = keys.current.total - prev.total;
        samplesRef.current.push(Math.round(dTotal / 5 / (bucketSeconds / 60)));

        const snap = liveRef.current;
        const c = charBreakdown(snap.words, snap.history, snap.current);
        timelineRef.current.push({
          t: nextIndex,
          wpm: wpmOf(c.correct, nextIndex),
          raw: wpmOf(keys.current.total, nextIndex),
          errors: errorsPerSecondRef.current[prev.index] ?? 0,
        });
        secondMarkRef.current = { index: nextIndex, total: keys.current.total };
      }
      // if we somehow fell far behind (backgrounded tab), snap forward
      if (secondMarkRef.current.index < secIdx) {
        secondMarkRef.current = { index: secIdx, total: keys.current.total };
      }

      if (settings.mode === "time" && passed >= settings.duration) {
        finishRef.current();
      }
    }, 100);
    return () => window.clearInterval(iv);
  }, [status, settings.mode, settings.duration]);

  /* ---------- input handling ---------- */

  const start = useCallback(() => {
    startRef.current = Date.now();
    secondMarkRef.current = { index: 0, total: 0 };
    setStatus("running");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyEventLike): void => {
      if (status === "finished") return;

      // never hijack browser/global shortcuts; AltGr (ctrl+alt) stays allowed
      // ctrl+backspace is handled below for word deletion
      // alt+number navigation must not type into the test
      if (e.metaKey || (e.ctrlKey && !e.altKey && e.key !== "Backspace")) return;
      if (e.altKey && !e.ctrlKey) return;

      // Escape cancels the test completely (like Tab) — no results saved
      if (e.key === "Escape") {
        if (status === "running") {
          e.preventDefault();
          resetRef.current();
        }
        return;
      }

      if (e.key === "Tab") return;

      // Ctrl+Backspace deletes the whole word
      if (e.key === "Backspace" && e.ctrlKey) {
        e.preventDefault();
        if (current.length > 0) {
          // Delete back to the last space or beginning of current word
          const lastSpace = current.lastIndexOf(" ");
          setCurrent(lastSpace >= 0 ? current.slice(0, lastSpace + 1) : "");
        } else if (
          settings.freeBackspace &&
          history.length > 0 &&
          status === "running"
        ) {
          // restore the last word
          const prev = history[history.length - 1];
          setHistory(history.slice(0, -1));
          setCurrent(prev);
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (current.length > 0) {
          setCurrent(current.slice(0, -1));
        } else if (
          settings.freeBackspace &&
          history.length > 0 &&
          status === "running"
        ) {
          // restore the last word so user can backspace through it char-by-char
          const prev = history[history.length - 1];
          setHistory(history.slice(0, -1));
          setCurrent(prev);
        }
        return;
      }

      if (e.key === " ") {
        if (status !== "running" || current.length === 0) return;
        e.preventDefault();
        const targetWord = words[history.length] ?? "";
        const wrong = current !== targetWord;
        recordKey(wrong);
        if (wrong) {
          onError?.();
          if (settings.strictSpace) return;
        }
        const nextHistory = [...history, current];
        setHistory(nextHistory);
        setCurrent("");
        if (settings.mode === "words" && nextHistory.length >= settings.wordCount) {
          finishRef.current();
        }
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      if (status === "idle") start();

      const idx = current.length;
      const targetWord = words[history.length] ?? "";
      const expected = idx < targetWord.length ? targetWord[idx] : null;
      const correct = expected !== null && e.key === expected;

      if (!correct) {
        recordKey(true);
        onError?.();
        if (settings.stopOnError) return;
      } else {
        recordKey(false);
      }
      onKeypress?.();
      setCurrent(current + e.key);
    },
    [
      status,
      current,
      history,
      words,
      settings.freeBackspace,
      settings.strictSpace,
      settings.stopOnError,
      settings.mode,
      settings.wordCount,
      start,
      recordKey,
      onError,
      onKeypress,
    ],
  );

  /* words mode: auto-submit the final word when completed exactly */
  useEffect(() => {
    if (
      status !== "running" ||
      settings.mode !== "words" ||
      history.length !== settings.wordCount - 1 ||
      current.length === 0
    )
      return;
    if (current === words[history.length]) {
      const nextHistory = [...history, current];
      // Update liveRef before finishing so charBreakdown sees the correct state
      liveRef.current = { history: nextHistory, current: "", words };
      setHistory(nextHistory);
      setCurrent("");
      finishRef.current();
    }
  }, [current, status, history, words, settings.mode, settings.wordCount]);

  /* ---------- restart ---------- */

  const reset = useCallback(() => {
    statusRef.current = "idle";
    setStatus("idle");
    setHistory([]);
    setCurrent("");
    setElapsedMs(0);
    setFinalSeconds(null);
    setTimeline([]);
    setKeysView(ZERO_KEYS);
    keys.current = { total: 0, errors: 0 };
    startRef.current = 0;
    endRef.current = 0;
    secondMarkRef.current = { index: 0, total: 0 };
    samplesRef.current = [];
    errorsPerSecondRef.current = {};
    timelineRef.current = [];
  }, []);

  // Wire up reset to ref so handleKeyDown can call it
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  return {
    status,
    history,
    current,
    activeIndex: history.length,
    elapsedMs,
    timeLeft,
    timeline,
    liveWpm,
    liveRaw,
    liveAcc,
    counts,
    progress,
    handleKeyDown,
    reset,
  };
}
