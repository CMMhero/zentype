import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { Clock, Type, Monitor, RotateCcw } from "lucide-react";
import { GameSettings, Theme, HistoryItem, FontSize } from "../types";
import { WORDS_LIST } from "../constants";
import { useInterval } from "../hooks/useInterval";
import Caret from "../components/Caret";
import WpmGraph from "../components/WpmGraph";
import VirtualKeyboard from "../components/VirtualKeyboard";

const FONT_SIZES: Record<FontSize, string> = {
  sm: "text-base md:text-lg",
  base: "text-lg md:text-xl",
  lg: "text-xl md:text-2xl",
  xl: "text-2xl md:text-3xl",
  "2xl": "text-3xl md:text-4xl",
};

interface TestPageProps {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  theme: Theme;
}

const TestPage: React.FC<TestPageProps> = ({ settings, setSettings, setHistory, theme }) => {
  // --- Game State ---
  const [gameState, setGameState] = useState<"idle" | "running" | "finished">("idle");
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [currentWordInput, setCurrentWordInput] = useState("");
  const [wordHistory, setWordHistory] = useState<string[]>([]);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(settings.duration);

  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  const [timelineData, setTimelineData] = useState<{ time: number; wpm: number; raw: number }[]>([]);

  // Refs for logic
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // STRICT Stats Tracking
  const totalKeystrokes = useRef(0);
  const correctSpaceCount = useRef(0);

  // Consistency Tracking
  const intervalStats = useRef<number[]>([]); // Stores Raw WPM per interval
  const lastIntervalState = useRef({ keystrokes: 0, time: 0 });

  // Stable Timer Loop & Consistency Sampling
  useInterval(
    () => {
      if (gameState !== "running" || !startTime) return;

      const currentTime = Date.now();
      setNow(currentTime);

      const passed = (currentTime - startTime) / 1000;

      // Mode Timer
      if (settings.mode === "time") {
        const remaining = Math.max(0, settings.duration - passed);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          endGame();
          return;
        }
      }

      // Update Stats & Graph
      const s = calculateStats(currentTime);

      setTimelineData((prev) => {
        const last = prev[prev.length - 1];
        // Sample every 1 second
        if (!last || passed - last.time >= 1) {
          // Calculate Instant Raw WPM for consistency
          const dtMinutes = (currentTime - lastIntervalState.current.time) / 1000 / 60;
          const dKeys = totalKeystrokes.current - lastIntervalState.current.keystrokes;

          // Only add to interval stats if we have a meaningful time difference
          if (dtMinutes > 0.01) {
            const instantRawWpm = Math.round(dKeys / 5 / dtMinutes);
            intervalStats.current.push(instantRawWpm);
          }

          lastIntervalState.current = { keystrokes: totalKeystrokes.current, time: currentTime };

          return [...prev, { time: Math.floor(passed), wpm: s.wpm, raw: s.rawWpm }];
        }
        return prev;
      });
    },
    gameState === "running" ? 100 : null,
  );

  // --- Consistency Calculation ---
  const calculateConsistency = () => {
    const samples = intervalStats.current;
    if (samples.length <= 1) return 100;

    const relevantSamples = samples.slice(1);
    if (relevantSamples.length === 0) return 100;

    const sum = relevantSamples.reduce((a, b) => a + b, 0);
    const mean = sum / relevantSamples.length;

    if (mean === 0) return 0;

    const variance = relevantSamples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / relevantSamples.length;
    const stdDev = Math.sqrt(variance);

    const cv = stdDev / mean;
    const consistency = 100 * (1 - cv);

    return Math.max(0, Math.round(consistency));
  };

  // --- Stats Calculation ---
  const calculateStats = useCallback(
    (currentTime = Date.now()) => {
      // 1. Analyze Final Typed Text (Visual State)
      let visualCorrect = 0;
      let visualIncorrect = 0;
      let missedChars = 0;

      // Analyze History (Letters only)
      wordHistory.forEach((typed, idx) => {
        const target = targetWords[idx];
        // Check characters
        for (let i = 0; i < Math.min(typed.length, target.length); i++) {
          if (typed[i] === target[i]) visualCorrect++;
          else visualIncorrect++;
        }
        // Extras in history words
        if (typed.length > target.length) {
          visualIncorrect += typed.length - target.length;
        }
        // Missed chars in history words
        if (typed.length < target.length) {
          missedChars += target.length - typed.length;
        }
      });

      // Add Credit for Typed Spaces
      // We treat spaces as "Correct Characters" if they were actually typed
      visualCorrect += correctSpaceCount.current;

      // Analyze Current Word (if running)
      if (gameState !== "finished") {
        const currentTarget = targetWords[wordHistory.length] || "";
        for (let i = 0; i < Math.min(currentWordInput.length, currentTarget.length); i++) {
          if (currentWordInput[i] === currentTarget[i]) visualCorrect++;
          else visualIncorrect++;
        }
        if (currentWordInput.length > currentTarget.length) {
          visualIncorrect += currentWordInput.length - currentTarget.length;
        }
      }

      // 2. Extra Characters (Backspaced / Deleted)
      // Formula: extra_chars = total_keystrokes - correct_chars - incorrect_chars
      // This captures keys that don't exist in the final "Visual" analysis
      const extraChars = Math.max(0, totalKeystrokes.current - (visualCorrect + visualIncorrect));

      // 3. Time
      let timeElapsedInMin = 0;
      if (endTime && startTime) {
        timeElapsedInMin = (endTime - startTime) / 1000 / 60;
      } else if (startTime) {
        timeElapsedInMin = (currentTime - startTime) / 1000 / 60;
      }
      const effectiveTime = Math.max(timeElapsedInMin, 0.0001);

      // 4. WPM Calculations
      // Raw WPM = (Total Keystrokes / 5) / Time
      const rawWpm = Math.round(totalKeystrokes.current / 5 / effectiveTime);

      // Adjusted WPM = (Correct Chars / 5) / Time
      const wpm = Math.round(visualCorrect / 5 / effectiveTime);

      // 5. Accuracy
      // Accuracy = (Correct Chars / Total Keystrokes) * 100
      const accuracy = totalKeystrokes.current > 0 ? Math.round((visualCorrect / totalKeystrokes.current) * 100) : 0;

      // 6. Consistency
      const consistency = calculateConsistency();

      return {
        wpm,
        rawWpm,
        accuracy,
        consistency,
        correctChars: visualCorrect,
        incorrectChars: visualIncorrect,
        extraChars,
        missedChars,
      };
    },
    [wordHistory, currentWordInput, targetWords, startTime, endTime, gameState],
  );

  const stats = useMemo(
    () => calculateStats(gameState === "finished" && endTime ? endTime : now),
    [calculateStats, now, gameState, endTime],
  );

  // --- Actions ---
  const generateWords = useCallback(() => {
    const count = settings.mode === "words" ? settings.wordCount : 300;
    const shuffled = [...WORDS_LIST].sort(() => 0.5 - Math.random());
    while (shuffled.length < count) {
      shuffled.push(...[...WORDS_LIST].sort(() => 0.5 - Math.random()));
    }
    setTargetWords(shuffled.slice(0, count));
  }, [settings.mode, settings.wordCount]);

  const resetGame = useCallback(() => {
    setGameState("idle");
    setWordHistory([]);
    setCurrentWordInput("");
    setStartTime(null);
    setEndTime(null);
    setTimeLeft(settings.duration);
    setTimelineData([]);
    setCursorPosition({ top: 0, left: 0 });

    // Reset Stats Refs
    totalKeystrokes.current = 0;
    correctSpaceCount.current = 0;
    intervalStats.current = [];
    lastIntervalState.current = { keystrokes: 0, time: Date.now() };

    generateWords();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [settings.duration, generateWords]);

  const endGame = useCallback(() => {
    const finishTime = Date.now();
    setGameState("finished");
    setEndTime(finishTime);

    // Calculate final stats using the closure state or refs
    // Note: Since this is useCallback, ensure dependencies are correct.
    // We use the stats calculated inside the component body which uses current state.
    // But we need to pass the time.

    const finalStats = calculateStats(finishTime);

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      wpm: finalStats.wpm,
      raw: finalStats.rawWpm,
      accuracy: finalStats.accuracy,
      consistency: finalStats.consistency,
      correctChars: finalStats.correctChars,
      incorrectChars: finalStats.incorrectChars,
      extraChars: finalStats.extraChars,
      missedChars: finalStats.missedChars,
      mode: settings.mode,
      info: settings.mode === "time" ? `${settings.duration}s` : `${settings.wordCount}w`,
      timeline: timelineData,
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
  }, [calculateStats, settings.mode, settings.duration, settings.wordCount, timelineData, setHistory]);

  const submitWord = useCallback(() => {
    if (currentWordInput.length === 0) return;

    setWordHistory((prev) => [...prev, currentWordInput]);
    setCurrentWordInput("");
    setCursorPosition({ top: 0, left: 0 });
  }, [currentWordInput]);

  // --- Effects ---
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // End Game Check for Words Mode
  useEffect(() => {
    if (gameState === "running" && settings.mode === "words" && wordHistory.length >= settings.wordCount) {
      endGame();
    }
  }, [wordHistory, gameState, settings.mode, settings.wordCount, endGame]);

  // Stable Timer Loop & Consistency Sampling
  useInterval(
    () => {
      if (gameState !== "running" || !startTime) return;

      const currentTime = Date.now();
      setNow(currentTime);

      const passed = (currentTime - startTime) / 1000;

      // Mode Timer
      if (settings.mode === "time") {
        const remaining = Math.max(0, settings.duration - passed);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          endGame();
          return;
        }
      }

      // Update Stats & Graph
      const s = calculateStats(currentTime);

      setTimelineData((prev) => {
        const last = prev[prev.length - 1];
        // Sample every 1 second
        if (!last || passed - last.time >= 1) {
          // Calculate Instant Raw WPM for consistency
          const dtMinutes = (currentTime - lastIntervalState.current.time) / 1000 / 60;
          const dKeys = totalKeystrokes.current - lastIntervalState.current.keystrokes;

          const instantRawWpm = dtMinutes > 0 ? dKeys / 5 / dtMinutes : 0;

          intervalStats.current.push(instantRawWpm);
          lastIntervalState.current = { keystrokes: totalKeystrokes.current, time: currentTime };

          return [...prev, { time: Math.floor(passed), wpm: s.wpm, raw: s.rawWpm }];
        }
        return prev;
      });
    },
    gameState === "running" ? 100 : null,
  );

  // --- Input Handlers ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    setActiveKey(e.key.toLowerCase());

    // Start Game
    if (gameState === "idle" && /^[a-zA-Z0-9]$/.test(e.key)) {
      setGameState("running");
      setStartTime(Date.now());
      lastIntervalState.current = { keystrokes: 0, time: Date.now() };
    } else if (gameState === "idle" && e.key === " ") {
      e.preventDefault();
      return;
    }

    // Handle Space
    if (e.key === " ") {
      e.preventDefault();
      if (gameState === "running") {
        totalKeystrokes.current++; // Space is a keystroke
        correctSpaceCount.current++; // We treat space as correct if typed
        submitWord();
      }
      return;
    }

    if (gameState === "finished") return;

    // Track Keystrokes
    if (gameState === "running" || (gameState === "idle" && /^[a-zA-Z0-9]$/.test(e.key))) {
      // Count valid typing keys (chars + backspace)
      if (e.key.length === 1 || e.key === "Backspace") {
        totalKeystrokes.current++;
      }
    }

    inputRef.current?.focus();
  };

  const handleKeyUp = () => setActiveKey(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState === "finished") return;
    const val = e.target.value;

    // Fallback for mobile space handling
    if (val.endsWith(" ")) {
      // NOTE: We do NOT increment totalKeystrokes here to avoid double counting with KeyDown.
      // If KeyDown didn't fire (mobile weirdness), we might miss the stat, but double counting is worse.
      // Ideally we assume KeyDown handles the stat.
      // However, we MUST increment correctSpaceCount if we submit via space.
      // Actually, if KeyDown didn't fire, correctSpaceCount didn't increment either.
      // Safe compromise: Mobile users might have slightly lower stats if KeyDown is dropped, but logic is clean.

      setCurrentWordInput(val.trim());
      // Need to check if we haven't already submitted via KeyDown
      // But submitWord resets currentWordInput.
      // So if val has space, it means we haven't reset yet.
      // So we should submit.
      submitWord();
      return;
    }
    setCurrentWordInput(val);

    // Auto-submit last word
    if (settings.mode === "words" && wordHistory.length === settings.wordCount - 1) {
      const lastTarget = targetWords[wordHistory.length];
      if (val === lastTarget) {
        // This state update will trigger the useEffect to end the game
        setWordHistory((prev) => [...prev, val]);
        setCurrentWordInput("");
      }
    }
  };

  // --- Caret Layout (Unchanged) ---
  useLayoutEffect(() => {
    if (!activeWordRef.current) {
      setCursorPosition({ top: 0, left: 0 });
      return;
    }
    const activeWord = activeWordRef.current;
    const chars = activeWord.querySelectorAll(".char");
    const index = Math.min(currentWordInput.length, chars.length);
    let left = 0;
    let top = 0;
    if (chars.length > 0) {
      if (index < chars.length) {
        const target = chars[index] as HTMLElement;
        left = target.offsetLeft;
        top = target.offsetTop;
      } else {
        const last = chars[chars.length - 1] as HTMLElement;
        left = last.offsetLeft + last.offsetWidth;
        top = last.offsetTop;
      }
    }
    setCursorPosition({ left, top });
    if (wordsContainerRef.current) {
      const container = wordsContainerRef.current;
      const wordTop = activeWord.offsetTop;
      const containerTop = container.scrollTop;
      const containerHeight = container.offsetHeight;
      if (wordTop - containerTop > containerHeight / 2) {
        container.scrollTo({ top: wordTop - 60, behavior: "smooth" });
      }
    }
  }, [currentWordInput, gameState, wordHistory]);

  const renderWord = (word: string, index: number) => {
    const isHistory = index < wordHistory.length;
    const isActive = index === wordHistory.length;

    if (isHistory) {
      const typed = wordHistory[index];
      return (
        <span key={index} className="mr-4 mb-3 inline-block opacity-60">
          {word.split("").map((char, charIdx) => {
            const typedChar = typed[charIdx];
            const isCorrect = typedChar === char;
            return (
              <span key={charIdx} style={{ color: isCorrect ? theme.text : theme.error }}>
                {char}
              </span>
            );
          })}
          {typed.length > word.length && (
            <span style={{ color: theme.error, textDecoration: "underline" }}>{typed.slice(word.length)}</span>
          )}
        </span>
      );
    }

    if (isActive) {
      return (
        <span key={index} ref={activeWordRef} className="mr-4 mb-3 inline-block relative whitespace-nowrap">
          <Caret
            style={settings.caretStyle}
            color={theme.caret}
            x={cursorPosition.left}
            y={cursorPosition.top}
            smooth={settings.smoothCaret}
          />

          {word.split("").map((char, charIdx) => {
            const typedChar = currentWordInput[charIdx];
            let color = theme.sub;
            if (typedChar !== undefined) {
              color = typedChar === char ? theme.text : theme.error;
              if (settings.blindMode && typedChar !== char) {
                color = theme.sub;
              }
            }
            return (
              <span key={charIdx} className="char inline-block relative z-10" style={{ color }}>
                {char}
              </span>
            );
          })}
          {currentWordInput.length > word.length && (
            <span className="char relative z-10" style={{ color: theme.error }}>
              {currentWordInput.slice(word.length)}
            </span>
          )}
        </span>
      );
    }

    return (
      <span key={index} className="mr-4 mb-3 inline-block" style={{ color: theme.sub, opacity: 0.3 }}>
        {word}
      </span>
    );
  };

  return (
    <div
      className="w-full flex-1 flex flex-col items-center outline-none"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute top-0 left-0 w-0 h-0 pointer-events-none"
        value={currentWordInput}
        onChange={handleInputChange}
        autoFocus
        autoComplete="off"
      />

      {gameState !== "finished" ? (
        <div className="w-full flex flex-col gap-6 mt-8">
          {/* Mode Selection */}
          <div
            className="flex justify-center items-center gap-6 text-sm bg-black/25 py-2.5 rounded-xl w-[24rem] mx-auto px-6 transition-opacity duration-300 shadow-md"
            style={{ opacity: gameState === "running" ? 0.2 : 1 }}
          >
            <div className="flex gap-4">
              <button
                onClick={() => setSettings((s) => ({ ...s, mode: "time" }))}
                className={`transition-colors hover: flex items-center gap-1.5 ${settings.mode === "time" ? "font-bold" : "opacity-50"}`}
                style={settings.mode === "time" ? { color: theme.main } : { color: theme.text }}
              >
                <Clock size={14} /> Time
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, mode: "words" }))}
                className={`transition-colors hover: flex items-center gap-1.5 ${settings.mode === "words" ? "font-bold" : "opacity-50"}`}
                style={settings.mode === "words" ? { color: theme.main } : { color: theme.text }}
              >
                <Type size={14} /> Words
              </button>
            </div>
            <div className="w-px h-4 bg-current opacity-10 mx-2"></div>
            <div className="flex gap-4 text-xs md:text-sm">
              {settings.mode === "time"
                ? [10, 15, 30, 60].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSettings((s) => ({ ...s, duration: n }))}
                      className={`transition-colors hover: ${settings.duration === n ? " font-bold" : "opacity-50"}`}
                      style={settings.duration === n ? { color: theme.main } : { color: theme.text }}
                    >
                      {n}
                    </button>
                  ))
                : [10, 25, 50, 100].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSettings((s) => ({ ...s, wordCount: n }))}
                      className={`transition-colors hover: ${settings.wordCount === n ? " font-bold" : "opacity-50"}`}
                      style={settings.wordCount === n ? { color: theme.main } : { color: theme.text }}
                    >
                      {n}
                    </button>
                  ))}
            </div>
          </div>

          <div
            className={`flex justify-between items-end px-4 mt-6 mb-2 transition-opacity duration-500 ${settings.hideLiveStats && gameState === "running" ? "opacity-0" : "opacity-100"}`}
            style={{ color: theme.main }}
          >
            <div className="text-4xl font-bold">
              {gameState === "running" ? stats.wpm : 0} <span className="text-base opacity-50 font-normal">WPM</span>
            </div>
            <div className="text-4xl font-bold">
              {settings.mode === "time" ? (
                <>
                  {Math.ceil(timeLeft)} <span className="text-base opacity-50 font-normal">s</span>
                </>
              ) : (
                <>
                  {wordHistory.length}/{settings.wordCount} <span className="text-base opacity-50 font-normal">w</span>
                </>
              )}
            </div>
          </div>

          <div
            className={`w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-8 transition-opacity duration-500 ${settings.hideLiveStats && gameState === "running" ? "opacity-0" : "opacity-100"}`}
          >
            <div
              className="h-full transition-all duration-200 ease-linear"
              style={{
                backgroundColor: theme.main,
                width:
                  settings.mode === "time"
                    ? `${(timeLeft / settings.duration) * 100}%`
                    : `${Math.max(0, ((settings.wordCount - wordHistory.length) / settings.wordCount) * 100)}%`,
              }}
            ></div>
          </div>

          <div className="relative group min-h-[12rem]">
            {!isFocused && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center rounded-lg cursor-pointer backdrop-blur-sm bg-black/20 transition-all duration-300"
                onClick={() => inputRef.current?.focus()}
              >
                <span className="bg-white/20 px-4 py-2 rounded animate-pulse flex items-center gap-2 shadow-lg">
                  <Monitor size={16} /> Click to focus
                </span>
              </div>
            )}

            <div
              ref={wordsContainerRef}
              className={`relative leading-relaxed tracking-wide outline-none no-scrollbar h-64 overflow-hidden ${FONT_SIZES[settings.fontSize]}`}
              onClick={() => inputRef.current?.focus()}
              style={{ filter: !isFocused ? "blur(4px)" : "none", transition: "filter 0.3s" }}
            >
              <div className="flex flex-wrap content-start py-2 pl-1">
                {targetWords.map((word, idx) => renderWord(word, idx))}
              </div>
            </div>
          </div>

          <VirtualKeyboard activeKey={activeKey} theme={theme} />
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in-up mt-8">
          <div className="grid grid-cols-2 gap-8 md:gap-16 mb-12 w-full">
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold tracking-widest opacity-50 mb-2">WPM</div>
              <div className="text-8xl font-bold leading-none" style={{ color: theme.main }}>
                {stats.wpm}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold tracking-widest opacity-50 mb-2">ACCURACY</div>
              <div className="text-8xl font-bold leading-none" style={{ color: theme.main }}>
                {stats.accuracy}%
              </div>
            </div>
          </div>

          <WpmGraph data={timelineData} theme={theme} />

          <div className="flex flex-wrap gap-8 text-center mb-10 p-8 rounded-3xl bg-black/25 w-full justify-center shadow-lg">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold" style={{ color: theme.text }}>
                {stats.rawWpm}
              </span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Raw WPM</span>
            </div>
            <div className="w-px bg-current opacity-10"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold" style={{ color: theme.text }}>
                {stats.consistency}%
              </span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Consistency</span>
            </div>
            <div className="w-px bg-current opacity-10"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold" style={{ color: theme.main }}>
                {stats.correctChars}
              </span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Correct</span>
            </div>
            <div className="w-px bg-current opacity-10"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold" style={{ color: theme.error }}>
                {stats.incorrectChars}
              </span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Incorrect</span>
            </div>
            <div className="w-px bg-current opacity-10"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold opacity-50">{stats.extraChars}</span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Extra</span>
            </div>
            <div className="w-px bg-current opacity-10"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold opacity-50">{Math.round((endTime! - startTime!) / 1000)}s</span>
              <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Time</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="px-8 py-4 rounded-xl text-lg font-bold transition hover:opacity-90 hover:scale-105 shadow-lg flex items-center gap-3"
              style={{ backgroundColor: theme.main, color: theme.bg }}
            >
              <RotateCcw size={20} /> Next Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
