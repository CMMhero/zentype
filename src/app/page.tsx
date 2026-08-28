"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfigBar } from "~/components/typing/config-bar";
import { TypingDisplay } from "~/components/typing/typing-display";
import { VirtualKeyboard } from "~/components/typing/virtual-keyboard";
import { ResultView, type SaveState } from "~/components/typing/result-view";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { Kbd } from "~/components/ui/kbd";
import { useTypingEngine } from "~/hooks/use-typing-engine";
import { useSettingsStore } from "~/stores/settings-store";
import { useResultsStore } from "~/stores/results-store";
import { useUiStore } from "~/stores/ui-store";
import { cryptoUuid } from "~/lib/id";
import { isDialogOpen, isTypingTarget } from "~/lib/keyboard";
import { playError, playKeypress } from "~/lib/sound";
import { randomWordSlice } from "~/lib/prompt-utils";
import { getPrompt } from "~/server/prompts";
import { mergeLocalResults, saveResult } from "~/server/results";
import { processTestResult } from "~/server/gamification";
import { useUser } from "~/components/user-provider";
import type { GameSettings, TestResult } from "~/lib/types";

export default function TestPage() {
  const user = useUser();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const helpOpen = useUiStore((s) => s.helpOpen);
  const setTestRunning = useUiStore((s) => s.setTestRunning);

  const [words, setWords] = useState<string[]>([]);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("skipped");
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
    async (cfg: Pick<GameSettings, "mode" | "duration" | "wordCount" | "source">) => {
      const want =
        cfg.mode === "time"
          ? Math.min(220, Math.ceil(cfg.duration * 3.2))
          : cfg.wordCount + 10;
      if (cfg.source === "words") return randomWordSlice(want);
      try {
        const res = await getPrompt(cfg.source, want);
        const w = res.text.split(/\s+/).filter(Boolean);
        if (w.length === 0) throw new Error("empty prompt");
        if (res.fallback) {
          toast.info(`${cfg.source} unavailable — using English words`);
        }
        return w;
      } catch {
        toast.warning(`Couldn't fetch ${cfg.source} — fell back to words`);
        return randomWordSlice(want);
      }
    },
    [],
  );

  const loadPrompt = useCallback(
    async (cfg: Pick<GameSettings, "mode" | "duration" | "wordCount" | "source">) => {
      setLoadingPrompt(true);
      if (prefetchedRef.current) {
        setWords(prefetchedRef.current);
        prefetchedRef.current = null;
        setLoadingPrompt(false);
        void fetchWords(cfg).then((w) => { prefetchedRef.current = w; });
        return;
      }
      const w = await fetchWords(cfg);
      setWords(w);
      setLoadingPrompt(false);
      void fetchWords(cfg).then((next) => { prefetchedRef.current = next; });
    },
    [fetchWords],
  );

  /* ---------- engine ---------- */

  const addLocal = useResultsStore((s) => s.addLocal);
  const removeLocal = useResultsStore((s) => s.removeLocal);

  const onFinishRef = useRef<(r: Omit<TestResult, "id" | "createdAt">) => void>(
    () => {},
  );

  const engine = useTypingEngine({
    words,
    settings,
    onError: () => {
      if (soundOnErrorRef.current && soundRef.current.enabled) playError(soundRef.current.volume);
    },
    onKeypress: () => {
      if (soundRef.current.enabled)
        playKeypress(soundRef.current.variant, soundRef.current.volume);
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
    addLocal(full);

    if (!user) {
      setSaveState("guest");
      return;
    }
    void saveResult(full)
      .then((res) => {
        if (res.saved) {
          removeLocal(full.id);
          setSaveState("cloud");
          // Process gamification (XP + achievements) silently - no popup/sonner to avoid interrupting chained tests
          void processTestResult(full).catch((err) => console.error("[zentype] processTestResult failed:", err));
        } else if (res.reason === "guest") {
          setSaveState("guest");
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

  useEffect(() => {
    prefetchedRef.current = null;
    void loadPrompt(settings);
    engineRef.current.reset();
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.source]);

  /* ---------- extend words during long time-mode tests ---------- */

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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.activeIndex, engine.status]);

  /* ---------- global key handling for the test ---------- */

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      setActiveKey(e.key.toLowerCase());
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
    const onUp = () => setActiveKey(null);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [engine, paletteOpen, helpOpen]);

  /* ---------- restart hotkey event ---------- */

  useEffect(() => {
    const h = () => restartRef.current();
    window.addEventListener("zt:restart", h);
    return () => window.removeEventListener("zt:restart", h);
  }, []);

  const inputEl = useRef<HTMLInputElement>(null);

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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <input
        ref={inputEl}
        className="pointer-events-none absolute size-0 opacity-0"
        aria-hidden
        tabIndex={-1}
        data-zt-ignore
        onChange={() => {}}
      />

      <div className={`pb-4 transition-all duration-200 ${engine.status === "running" ? "pointer-events-none opacity-50" : "opacity-100"}`}>
        <ConfigBar
          mode={settings.mode}
          duration={settings.duration}
          wordCount={settings.wordCount}
          locked={engine.status === "running"}
          onChange={applyConfig}
        />
      </div>

      {!runningOrIdle ? (
        result ? (
          <ResultView
            result={result}
            saveState={saveState}
            onNext={() => restartRef.current()}
          />
        ) : null
      ) : (
        <>
          <div
            className={`mb-4 flex items-end justify-between transition-opacity duration-300 ${
              settings.hideLiveStats && engine.status === "running" ? "opacity-50" : "opacity-100"
            }`}
          >
            <div className="flex items-baseline gap-5">
              <div>
                <span className="text-primary text-3xl font-bold tabular-nums">
                  {engine.liveWpm}
                </span>
                <span className="text-muted-foreground ml-1 text-xs font-medium">wpm</span>
              </div>
              <div>
                <span className="text-xl font-semibold tabular-nums">{engine.liveAcc}%</span>
                <span className="text-muted-foreground ml-1 text-xs font-medium">acc</span>
              </div>
            </div>
            <div className="text-right">
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

          <Progress value={engine.progress * 100} className="mb-6" aria-label="test progress" />

          <div className="relative flex-1 rounded-xl bg-gradient-to-b from-muted/20 to-transparent p-4">
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
                onClick={() => inputEl.current?.focus()}
                className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]"
              >
                <span className="border-border bg-card animate-pulse rounded border px-3 py-1.5 text-xs">
                  click here or press any key to focus
                </span>
              </button>
            )}
          </div>

          {settings.showKeyboard && (
            <VirtualKeyboard activeKey={activeKey} />
          )}

          <div className={`mt-6 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground transition-opacity duration-200 ${engine.status === "idle" && !loadingPrompt ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <p>press any key to start</p>
            <p className="flex flex-wrap items-center justify-center gap-1.5">
              <Kbd>tab</Kbd> new test <span>·</span> <Kbd>?</Kbd> shortcuts <span>·</span> <Kbd>esc</Kbd> close <span>·</span> <Kbd>{isMac ? "cmd" : "ctrl"}+k</Kbd> palette
            </p>
          </div>
        </>
      )}

    </div>
  );
}
