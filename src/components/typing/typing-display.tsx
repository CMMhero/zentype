import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Caret } from "~/components/typing/caret";
import { cn } from "~/lib/utils";
import type { CaretStyle, FontSizeKey, GameMode } from "~/lib/types";

const FONT_SIZES: Record<FontSizeKey, string> = {
  sm: "text-2xl md:text-3xl",
  md: "text-3xl md:text-4xl",
  lg: "text-4xl md:text-5xl",
  xl: "text-5xl md:text-6xl",
};

interface TypingDisplayProps {
  words: string[];
  history: string[];
  current: string;
  activeIndex: number;
  blindMode: boolean;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  fontSize: FontSizeKey;
  visibleLines: 1 | 2 | 3;
  gameMode: GameMode;
  wordCount: number;
  focused?: boolean;
}

export function TypingDisplay({
  words,
  history,
  current,
  activeIndex,
  blindMode,
  caretStyle,
  smoothCaret,
  fontSize,
  visibleLines,
  gameMode,
  wordCount,
}: TypingDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 24, w: 10 });
  const [scrollY, setScrollY] = useState(0);
  const [containerHeight, setContainerHeight] = useState("6em");  const measure = useCallback(() => {
    const content = contentRef.current;
    const activeEl = wordRefs.current.get(activeIndex);
    if (!content || !activeEl) return;

    const contentRect = content.getBoundingClientRect();
    const chars = activeEl.querySelectorAll<HTMLElement>("[data-char]");
    let x = activeEl.offsetLeft;
    let y = activeEl.offsetTop;
    let h = activeEl.offsetHeight;
    let w =
      activeEl.offsetWidth / Math.max(activeEl.textContent?.length ?? 1, 1);

    if (chars.length > 0) {
      const idx = Math.min(current.length, chars.length - 1);
      const r = chars[idx].getBoundingClientRect();
      x =
        (current.length >= chars.length ? r.right : r.left) - contentRect.left;
      y = r.top - contentRect.top;
      h = r.height;
      w = r.width;
    }

    setCaret((prev) =>
      Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5 && Math.abs(prev.h - h) < 0.5
        ? prev
        : { x, y, h, w },
    );

    // Measure actual rendered line height from multiple words for accuracy
    const firstWord = content.querySelector("[data-char]") as HTMLElement | null;
    if (!firstWord) return;
    const cs = window.getComputedStyle(firstWord);
    const fontSize = parseFloat(cs.fontSize);
    // Get actual line height from the computed style (handles all fonts/sizes)
    const computedLineHeight = parseFloat(cs.lineHeight);
    // Use the actual line height if available, otherwise calculate from font size
    const actualLineHeight = computedLineHeight || fontSize * 1.75;
    // Add margin-bottom from word elements for accurate line spacing
    const wordEl = content.querySelector(".mr-\\[1ch\\]") as HTMLElement | null;
    const marginBottom = wordEl ? parseFloat(window.getComputedStyle(wordEl).marginBottom) : fontSize * 0.35;
    const totalLineHeight = actualLineHeight + marginBottom;

    // Container height = visible lines * total line height + small buffer for anti-aliasing
    const containerH = visibleLines * totalLineHeight + 2; // 2px buffer for sub-pixel rendering
    setContainerHeight(`${containerH}px`);

    setScrollY((prevScroll) => {
      // Keep the active line at the top so the user always sees upcoming lines
      const target = Math.max(0, y);
      return Math.abs(prevScroll - target) < 0.5 ? prevScroll : target;
    });
  }, [activeIndex, current, visibleLines]);

  useLayoutEffect(() => {
    measure();
  }, [measure, words, history, fontSize]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const setWordRef = useCallback(
    (i: number) => (el: HTMLSpanElement | null) => {
      if (el) wordRefs.current.set(i, el);
      else wordRefs.current.delete(i);
    },
    [],
  );

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: containerHeight }}
      aria-label="typing area"
    >
      <div
        ref={contentRef}
        className={cn(
          "relative leading-[1.75] tracking-wide transition-transform duration-150 ease-out will-change-transform",
          FONT_SIZES[fontSize],
        )}
        style={{ transform: `translateY(-${scrollY}px)` }}
      >
        <div className="flex flex-wrap content-start">
          {words.slice(0, gameMode === "words" ? wordCount : undefined).map((word, i) => {
            const isPast = i < activeIndex;
            const isActive = i === activeIndex;
            return (
              <Word
                key={`${i}-${word}`}
                refCb={isActive ? setWordRef(i) : undefined}
                word={word}
                typed={isPast ? history[i] : isActive ? current : undefined}
                state={isPast ? "past" : isActive ? "active" : "future"}
                blindMode={blindMode}
              />
            );
          })}
        </div>

        {/* caret lives inside the transformed box so it scrolls with lines */}
        <Caret
          style={caretStyle}
          x={caret.x}
          y={caret.y}
          height={caret.h}
          width={caret.w}
          smooth={smoothCaret}
        />
      </div>
    </div>
  );
}

const Word = React.memo(function Word({
  word,
  typed,
  state,
  blindMode,
  refCb,
}: {
  word: string;
  typed?: string;
  state: "past" | "active" | "future";
  blindMode: boolean;
  refCb?: (el: HTMLSpanElement | null) => void;
}) {
  // Use em-based spacing that scales with font size for consistent line breaks
  const cls = "mr-[1ch] mb-[0.35em] inline-block whitespace-nowrap select-none leading-[1.75]";

  if (state === "future") {
    return (
      <span className={cn(cls, "text-zt-sub")} aria-hidden>
        {word}
      </span>
    );
  }

  if (state === "past") {
    const t = typed ?? "";
    return (
      <span className={cls}>
        {Array.from(word).map((c, i) => {
          const ok = t[i] === c;
          const color = !t[i]
            ? "text-zt-sub"
            : blindMode || ok
              ? "text-foreground"
              : "text-destructive";
          return (
            <span key={i} data-char className={color} aria-hidden>
              {c}
            </span>
          );
        })}
        {Array.from(t.slice(word.length)).map((c, i) => (
          <span
            key={`e${i}`}
            data-char
            className={
              blindMode
                ? "text-foreground/70"
                : "text-destructive underline decoration-destructive/60"
            }
            aria-hidden
          >
            {c}
          </span>
        ))}
      </span>
    );
  }

  // active word
  const t = typed ?? "";
  return (
    <span ref={refCb} className={cls} data-active-word>
      {Array.from(word).map((c, i) => {
        const typedC = t[i];
        const color =
          typedC === undefined
            ? "text-zt-sub"
            : typedC === c || blindMode
              ? "text-foreground"
              : "text-destructive";
        return (
          <span key={i} data-char className={color} aria-hidden>
            {c}
          </span>
        );
      })}
      {Array.from(t.slice(word.length)).map((c, i) => (
        <span
          key={`e${i}`}
          data-char
          className={
            blindMode
              ? "text-foreground/70"
              : "text-destructive underline decoration-destructive/60"
          }
          aria-hidden
        >
          {c}
        </span>
      ))}
    </span>
  );
});
