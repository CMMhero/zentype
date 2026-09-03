"use client";

import { IconPointer } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfigBar } from "~/components/typing/config-bar";
import { ResultView, type SaveState } from "~/components/typing/result-view";
import { TypingDisplay } from "~/components/typing/typing-display";
import { VirtualKeyboard } from "~/components/typing/virtual-keyboard";
import { Kbd } from "~/components/ui/kbd";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/components/user-provider";
import { useTypingEngine } from "~/hooks/use-typing-engine";
import { lcGet } from "~/lib/client-cache";
import { cryptoUuid } from "~/lib/id";
import { isDialogOpen, isTypingTarget } from "~/lib/keyboard";
import { invalidateProfileCaches } from "~/lib/profile-cache";
import { randomWordSlice } from "~/lib/prompt-utils";
import { playError, playKeypress } from "~/lib/sound";
import type { GameSettings, TestResult } from "~/lib/types";
import { calculateTestXP } from "~/lib/xp";
import { processTestResult } from "~/server/gamification";
import { getPrompt } from "~/server/prompts";
import type { AggregatedStats } from "~/server/results";
import { mergeLocalResults, saveResult } from "~/server/results";
import { useResultsStore } from "~/stores/results-store";
import { useSettingsStore } from "~/stores/settings-store";
import { useUiStore } from "~/stores/ui-store";

/** Detect mobile/touch device for keyboard input routing */
const isMobile =
  typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Session-scoped in-memory prompt cache. Navigating away and back to the test
 * page remounts it, so reusing the last generated words for a config renders
 * immediately instead of flashing the loading skeleton. Entries are dropped
 * when a test finishes so the next prompt is always fresh.
 */
const promptCache = new Map<string, string[]>();

function promptCacheKey(
  cfg: Pick<GameSettings, "mode" | "duration" | "wordCount" | "source" | "punctuation" | "numbers">,
): string {
  return [
    cfg.mode,
    cfg.duration,
    cfg.wordCount,
    cfg.source,
    cfg.punctuation ? "punct" : "plain",
    cfg.numbers ? "nums" : "no-nums",
  ].join(":");
}

function rememberPrompt(
  cfg: Pick<GameSettings, "mode" | "duration" | "wordCount" | "source" | "punctuation" | "numbers">,
  words: string[],
): void {
  promptCache.set(promptCacheKey(cfg), words);
  if (promptCache.size > 8) {
    const oldest = promptCache.keys().next().value;
    if (oldest) promptCache.delete(oldest);
  }
}

/**
 * Best-effort PB check for the just-finished test. Returns:
 * - false when a known local/cached result on the same board is faster or equal
 * - true when nothing faster is known (guests: full local history; signed-in
 *   users: no prior result on the board in cached stats)
 * - null when the account history is unknown (cache cleared by a recent save)
 *   — the caller should then use the server verdict from saveResult.
 */
function computeResultPB(result: TestResult, userId: string | null): boolean | null {
  const board = `${result.mode}:${result.variant}`;

  // 1. Local results: guests keep their whole history here, and it also covers
  //    pending cloud saves — anything faster/equal means this isn't a PB.
  const localResults = useResultsStore.getState().local;
  for (const r of localResults) {
    if (r.id === result.id) continue;
    if (`${r.mode}:${r.variant}` === board && r.wpm >= result.wpm) return false;
  }

  // 2. Guests have no server history — nothing local higher means it's a PB.
  if (!userId) return true;

  // 3. Signed in: compare against cached account stats when available
  //    (namespaced by user id, falls back to the old key).
  const FIVE_MIN = 5 * 60 * 1000;
  const stats =
    lcGet<AggregatedStats>(`${userId}:profile-stats`, FIVE_MIN) ??
    lcGet<AggregatedStats>("profile-stats", FIVE_MIN);
  if (stats) {
    const best = stats.bestByBoard[board];
    if (best === undefined) return true; // never played this board → PB
    return result.wpm > best;
  }

  // 4. No cached account stats — the server reports isPB once saveResult resolves.
  return null;
}

export default function TestPage() {
  const user = useUser();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const helpOpen = useUiStore((s) => s.helpOpen);
  const setTestRunning = useUiStore((s) => s.setTestRunning);

  // Warm prompt cache (e.g. returning to the test page mid-session) → render
  // words on the first commit instead of a skeleton frame while they load.
  const [initialPrompt] = useState(() => {
    const cached = promptCache.get(promptCacheKey(settings));
    return cached && cached.length > 0 ? { key: promptCacheKey(settings), words: cached } : null;
  });
  const [words, setWords] = useState<string[]>(() => initialPrompt?.words ?? []);
  const [loadingPrompt, setLoadingPrompt] = useState(() => !initialPrompt);
  const [result, setResult] = useState<TestResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("skipped");
  const [isPB, setIsPB] = useState(false);
  const [focused, setFocused] = useState(true);
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;
  const soundOnErrorRef = useRef(settings.soundOnError);
  soundOnErrorRef.current = settings.soundOnError;

  /* ---------- prompt loading + pre-fetch ---------- */

  const prefetchedRef = useRef<string[] | null>(null);

  const fetchWords = useCallback(
    async (
      cfg: Pick<
        GameSettings,
        "mode" | "duration" | "wordCount" | "source" | "punctuation" | "numbers"
      >,
    ) => {
      const want =
        cfg.mode === "time" ? Math.min(220, Math.ceil(cfg.duration * 3.2)) : cfg.wordCount + 10;
      if (cfg.source === "words")
        return randomWordSlice(want, { punctuation: cfg.punctuation, numbers: cfg.numbers });
      try {
        const res = await getPrompt(cfg.source, want);
        const w = res.text.split(/\s+/).filter(Boolean);
        if (w.length === 0) throw new Error("empty prompt");
        if (res.fallback) {
          toast.info(`${cfg.source} unavailable, using English words`);
        }
        return w;
      } catch {
        toast.warning(`Couldn't fetch ${cfg.source}, fell back to words`);
        return randomWordSlice(want);
      }
    },
    [],
  );

  const loadPromptIdRef = useRef(0);

  const loadPrompt = useCallback(
    async (
      cfg: Pick<
        GameSettings,
        "mode" | "duration" | "wordCount" | "source" | "punctuation" | "numbers"
      >,
    ) => {
      const id = ++loadPromptIdRef.current;
      setLoadingPrompt(true);
      if (prefetchedRef.current) {
        setWords(prefetchedRef.current);
        rememberPrompt(cfg, prefetchedRef.current);
        prefetchedRef.current = null;
        setLoadingPrompt(false);
        void fetchWords(cfg).then((w) => {
          if (id === loadPromptIdRef.current) prefetchedRef.current = w;
        });
        return;
      }
      const w = await fetchWords(cfg);
      if (id !== loadPromptIdRef.current) return; // stale, a newer call superseded us
      setWords(w);
      rememberPrompt(cfg, w);
      setLoadingPrompt(false);
      void fetchWords(cfg).then((next) => {
        if (id === loadPromptIdRef.current) prefetchedRef.current = next;
      });
    },
    [fetchWords],
  );

  /* ---------- engine ---------- */

  const addLocal = useResultsStore((s) => s.addLocal);
  const removeLocal = useResultsStore((s) => s.removeLocal);

  const onFinishRef = useRef<(r: Omit<TestResult, "id" | "createdAt">) => void>(() => {});

  const engine = useTypingEngine({
    words,
    settings,
    onError: () => {
      if (soundOnErrorRef.current && soundRef.current.enabled) playError(soundRef.current.volume);
    },
    onKeypress: () => {
      if (soundRef.current.enabled) playKeypress(soundRef.current.variant, soundRef.current.volume);
    },
    onFinish: (r) => onFinishRef.current(r),
  });

  useEffect(() => {
    setTestRunning(engine.status === "running");
  }, [engine.status, setTestRunning]);

  onFinishRef.current = (partial) => {
    const full: TestResult = {
      id: cryptoUuid(),
      createdAt: new Date().toISOString(),
      ...partial,
    };
    setResult(full);
    setSaveState("skipped");
    // Guests and users with cached stats get an instant verdict; users whose
    // stats cache was cleared wait for the server answer after the save.
    const verdict = computeResultPB(full, user?.id ?? null);
    if (verdict !== null) setIsPB(verdict);
    addLocal(full);
    // Finished prompts shouldn't replay — the next visit fetches a fresh set
    promptCache.delete(promptCacheKey(settingsRef.current));

    // Show immediate XP toast (client-side estimate, no DB wait)
    if (user) {
      const xp = calculateTestXP(full, 0);
      toast.success(`+${xp} XP`, { duration: 2000 });
    }

    if (!user) {
      setSaveState("guest");
      return;
    }
    void saveResult(full)
      .then((res) => {
        if (res.saved) {
          removeLocal(full.id);
          setSaveState("cloud");
          // Authoritative PB verdict from the server (pre-save board best)
          if (typeof res.isPB === "boolean") setIsPB(res.isPB);
          // Drop cached profile data so the next visit refetches fresh stats
          if (user) invalidateProfileCaches(user.id, user.username);
          // Process gamification (XP + achievements) silently - no popup/sonner to avoid interrupting chained tests
          // Defer gamification to next frame so result view paints without jank
          requestAnimationFrame(() => {
            void processTestResult(full).catch((err) =>
              console.error("[zentype] processTestResult failed:", err),
            );
          });
        } else if (res.reason === "guest") {
          setSaveState("guest");
        } else if (res.reason === "implausible") {
          setSaveState("invalid");
        } else {
          setSaveState("failed");
        }
      })
      .catch(() => setSaveState("failed"));
  };

  /* ---------- guest -> account sync ---------- */

  useEffect(() => {
    if (!user) return;
    const locals = useResultsStore.getState().local;
    if (locals.length === 0) return;
    void mergeLocalResults(locals)
      .then((r) => {
        if (r.merged > 0) toast.success(`Synced ${r.merged} local test(s) to your account`);
        useResultsStore.getState().clearLocal();
      })
      .catch(() => {});
  }, [user]);

  /* ---------- restart / new test ---------- */

  const restartRef = useRef<() => void>(() => {});

  const restart = useCallback(() => {
    setResult(null);
    setSaveState("skipped");
    engineRef.current.reset();
    void loadPrompt(settingsRef.current);
  }, [loadPrompt]);

  const engineRef = useRef(engine);
  engineRef.current = engine;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  restartRef.current = restart;

  // biome-ignore lint/correctness/useExhaustiveDependencies: must only re-run when the test config changes; other settings (font, theme, sound, …) change frequently and must not restart a running test
  useEffect(() => {
    prefetchedRef.current = null;
    engineRef.current.reset();
    setResult(null);
    // Mounted with words from the session cache for this config? Nothing to
    // fetch — just warm the next prompt in the background.
    if (initialPrompt && promptCacheKey(settings) === initialPrompt.key) {
      void fetchWords(settings).then((next) => {
        prefetchedRef.current = next;
      });
      return;
    }
    void loadPrompt(settings);
  }, [
    settings.source,
    settings.punctuation,
    settings.numbers,
    settings.mode,
    settings.duration,
    settings.wordCount,
  ]);

  /* ---------- extend words during long time-mode tests ---------- */

  // biome-ignore lint/correctness/useExhaustiveDependencies: polling effect keyed off engine progress; words/settings are read reactively each run and re-listing them would restart the poll on unrelated changes
  useEffect(() => {
    if (engine.status !== "running" || settings.mode !== "time") return;
    if (words.length - engine.activeIndex > 40 || words.length === 0) return;
    let cancelled = false;
    const extend = async () => {
      if (settings.source === "words") {
        setWords((prev) => [...prev, ...randomWordSlice(100)]);
        return;
      }
      try {
        const res = await getPrompt(settings.source, 80);
        if (!cancelled && res.text) {
          setWords((prev) => [...prev, ...res.text.split(/\s+/).filter(Boolean)]);
        }
      } catch {
        if (!cancelled) setWords((prev) => [...prev, ...randomWordSlice(100)]);
      }
    };
    void extend();
    return () => {
      cancelled = true;
    };
  }, [engine.activeIndex, engine.status]);

  /* ---------- global key handling for the test ---------- */

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (paletteOpen || helpOpen || isDialogOpen()) return;
      if (isTypingTarget(e.target)) return;

      if (engine.status === "finished" && e.key === "Enter") {
        e.preventDefault();
        restartRef.current();
        return;
      }

      engine.handleKeyDown(e as unknown as Parameters<typeof engine.handleKeyDown>[0]);
      inputEl.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onDown);
    return () => {
      window.removeEventListener("keydown", onDown);
    };
  }, [engine, paletteOpen, helpOpen]);

  /* ---------- restart hotkey event ---------- */

  useEffect(() => {
    const h = () => restartRef.current();
    window.addEventListener("zt:restart", h);
    return () => window.removeEventListener("zt:restart", h);
  }, []);

  const inputEl = useRef<HTMLInputElement>(null);
  const mobileBackspaceRef = useRef(false);

  useEffect(() => {
    inputEl.current?.focus({ preventScroll: true });
    const onFocus = () => setFocused(true);
    const onBlur = (e: FocusEvent) => {
      if (e.target === inputEl.current) setFocused(false);
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  function applyConfig(patch: Partial<GameSettings>) {
    update(patch);
    const merged = { ...settings, ...patch };
    engineRef.current.reset();
    setResult(null);
    void loadPrompt(merged);
  }

  const runningOrIdle = engine.status !== "finished";

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col ${!runningOrIdle ? "items-center" : "max-w-5xl"} px-4 py-6 md:py-6`}
      role="region"
      aria-label="Typing test"
    >
      <input
        ref={inputEl}
        className="absolute left-1/2 top-1/2 -z-10 h-px w-px -translate-x-1/2 -translate-y-1/2 opacity-0"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-zt-ignore
        onKeyDown={(e) => {
          if (!isMobile) return;
          // On mobile, only forward non-printable keys (backspace, enter, tab, etc.).
          // Printable characters go through onInput to avoid double-processing.
          const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
          if (printable) return;
          if (!e.repeat) {
            if (e.key === "Backspace") mobileBackspaceRef.current = true;
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: e.key,
                code: e.code,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                altKey: e.altKey,
              }),
            );
          }
        }}
        onInput={(e) => {
          // Mobile software keyboards route characters through onInput.
          // Use inputType to reliably detect backspace across all mobile browsers
          // (Firefox mobile may not fire onKeyDown for backspace reliably).
          if (!isMobile) return;
          const native = e.nativeEvent as InputEvent;
          const input = e.target as HTMLInputElement;

          // Backspace: native browser already deleted a char from the input.
          // If onKeyDown handled it, the engine already processed it.
          // If onKeyDown didn't fire (Firefox mobile), dispatch it now.
          if (native.inputType === "deleteContentBackward") {
            if (!mobileBackspaceRef.current) {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
            }
            mobileBackspaceRef.current = false;
            input.value = "";
            return;
          }

          // Forward delete too
          if (native.inputType === "deleteContentForward") {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
            input.value = "";
            return;
          }

          const val = input.value;
          if (val.length === 0) return;
          // Clear the input so it stays hidden
          input.value = "";
          for (const ch of val) {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: ch }));
            window.dispatchEvent(new KeyboardEvent("keyup", { key: ch }));
          }
        }}
        onChange={() => {}}
      />

      <div
        className={`pb-4 transition-all duration-200 ${engine.status === "running" ? "pointer-events-none opacity-50" : "opacity-100"}`}
      >
        <ConfigBar
          mode={settings.mode}
          duration={settings.duration}
          wordCount={settings.wordCount}
          punctuation={settings.punctuation}
          numbers={settings.numbers}
          locked={engine.status === "running"}
          onChange={applyConfig}
        />
      </div>

      {!runningOrIdle ? (
        result ? (
          <div className="zt-fade-in flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
            <ResultView
              result={result}
              saveState={saveState}
              isPB={isPB}
              user={user}
              onNext={() => restartRef.current()}
            />
          </div>
        ) : null
      ) : (
        <>
          <div
            className="mb-4 flex items-end justify-between"
            aria-live="polite"
            aria-atomic="true"
          >
            <div
              className={`transition-opacity duration-300 ${
                settings.hideLiveStats && engine.status === "running"
                  ? "pointer-events-none opacity-0"
                  : "opacity-100"
              }`}
            >
              <div className="flex items-baseline gap-3 sm:gap-5">
                <div>
                  <span className="text-primary text-2xl font-bold tabular-nums sm:text-3xl">
                    {engine.liveWpm}
                  </span>
                  <span className="text-muted-foreground ml-1 text-xs font-medium">wpm</span>
                </div>
                <div>
                  <span className="text-lg font-semibold tabular-nums sm:text-xl">
                    {engine.liveAcc}%
                  </span>
                  <span className="text-muted-foreground ml-1 text-xs font-medium">acc</span>
                </div>
              </div>
            </div>
            <div
              className={`text-right transition-opacity duration-300 ${
                settings.hideProgress && engine.status === "running"
                  ? "pointer-events-none opacity-0"
                  : "opacity-100"
              }`}
            >
              {settings.mode === "time" ? (
                <span className="text-2xl font-bold tabular-nums">
                  {Math.ceil(engine.timeLeft)}
                  <span className="text-muted-foreground ml-1 text-xs font-medium">s</span>
                </span>
              ) : (
                <span className="text-2xl font-bold tabular-nums">
                  {Math.min(engine.history.length, settings.wordCount)}
                  <span className="text-muted-foreground text-sm">/{settings.wordCount}</span>
                  <span className="text-muted-foreground ml-1 text-xs font-medium">w</span>
                </span>
              )}
            </div>
          </div>

          <div className="mb-3 h-1.5 w-full">
            <div
              className={`h-full transition-opacity duration-300 ${
                settings.hideProgress && engine.status === "running" ? "opacity-0" : "opacity-100"
              }`}
            >
              <Progress
                value={engine.progress * 100}
                className="h-full"
                indicatorClassName="transition-all duration-300 ease-out"
                aria-label="test progress"
              />
            </div>
          </div>

          <div
            className="relative w-full p-4"
            onClick={() => {
              if (isMobile) inputEl.current?.focus();
            }}
          >
            {loadingPrompt ? (
              <div className="flex flex-col gap-3 py-2">
                <Skeleton className="h-7 w-4/5" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-3/5" />
              </div>
            ) : (
              <TypingDisplay
                words={words}
                history={engine.history}
                current={engine.current}
                activeIndex={engine.activeIndex}
                blindMode={settings.blindMode}
                caretStyle={settings.caretStyle}
                smoothCaret={settings.smoothCaret}
                fontSize={settings.fontSize}
                visibleLines={settings.visibleLines}
                gameMode={settings.mode}
                wordCount={settings.wordCount}
              />
            )}

            {!focused && runningOrIdle && !loadingPrompt && (
              <button
                type="button"
                onClick={() => inputEl.current?.focus()}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-4xl backdrop-blur-[2px]"
              >
                <span className="bg-card ring-foreground/5 shadow-sm animate-pulse flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs ring-1">
                  <IconPointer className="text-primary size-3.5" /> click here or press any key to
                  focus
                </span>
              </button>
            )}
          </div>

          {settings.showKeyboard && (
            <div className="flex flex-1 items-center justify-center py-2">
              <VirtualKeyboard />
            </div>
          )}

          <div
            className={`mt-auto flex flex-col items-center gap-1.5 pt-4 text-center text-xs text-muted-foreground transition-opacity duration-200 ${engine.status === "idle" && !loadingPrompt ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <p>press any key to start</p>
            <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-2 text-center">
              <span className="inline-flex items-center gap-1.5">
                <Kbd>tab</Kbd> new test
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Kbd>esc</Kbd> cancel test
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Kbd>?</Kbd> keybinds
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Kbd>{isMac ? "cmd" : "ctrl"} k</Kbd> commands
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
