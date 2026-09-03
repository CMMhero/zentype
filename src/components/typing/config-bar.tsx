import { IconAt, IconClock, IconHash, IconTypography } from "@tabler/icons-react";
import { PillButton, PillGroup } from "~/components/ui/pill-toggle";
import { type GameMode, TIME_OPTIONS, WORD_OPTIONS } from "~/lib/types";
import { cn } from "~/lib/utils";

interface ConfigBarProps {
  mode: GameMode;
  duration: number;
  wordCount: number;
  locked: boolean;
  punctuation: boolean;
  numbers: boolean;
  onChange: (patch: {
    mode?: GameMode;
    duration?: number;
    wordCount?: number;
    punctuation?: boolean;
    numbers?: boolean;
  }) => void;
}

export function ConfigBar({
  mode,
  duration,
  wordCount,
  locked,
  punctuation,
  numbers,
  onChange,
}: ConfigBarProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-fit flex-wrap items-center justify-center gap-2 text-sm transition-all duration-300 sm:gap-3",
        locked ? "pointer-events-none opacity-40" : "opacity-100",
      )}
      role="toolbar"
      aria-label="test configuration"
    >
      <div className="grid w-full grid-cols-[3fr_7fr] gap-2 sm:w-fit sm:grid-cols-none sm:flex sm:gap-2">
        {/* Mode selector */}
        <PillGroup
          value={[mode]}
          onValueChange={(v) => {
            const next = v[0];
            if (next) onChange({ mode: next as GameMode });
          }}
        >
          <PillButton value="time" aria-label="time mode">
            <IconClock className="size-3.5" /> time
          </PillButton>
          <PillButton value="words" aria-label="words mode">
            <IconTypography className="size-3.5" /> words
          </PillButton>
        </PillGroup>

        {/* Variant selector */}
        <PillGroup
          className="w-full min-w-0 sm:w-64"
          value={[String(mode === "time" ? duration : wordCount)]}
          onValueChange={(v) => {
            const next = v[0];
            if (next)
              onChange(mode === "time" ? { duration: Number(next) } : { wordCount: Number(next) });
          }}
        >
          {mode === "time"
            ? TIME_OPTIONS.map((t) => (
                <PillButton key={t} value={String(t)} aria-label={`${t} seconds`}>
                  {t}s
                </PillButton>
              ))
            : WORD_OPTIONS.map((w) => (
                <PillButton key={w} value={String(w)} aria-label={`${w} words`}>
                  {w}
                </PillButton>
              ))}
        </PillGroup>
      </div>

      {/* Punctuation & numbers toggles */}
      <PillGroup
        multiple
        value={[punctuation ? "punctuation" : "", numbers ? "numbers" : ""].filter(Boolean)}
        onValueChange={(v) =>
          onChange({
            punctuation: v.includes("punctuation"),
            numbers: v.includes("numbers"),
          })
        }
      >
        <PillButton value="punctuation" aria-label="toggle punctuation">
          <IconAt className="size-3.5" /> punct
        </PillButton>
        <PillButton value="numbers" aria-label="toggle numbers">
          <IconHash className="size-3.5" /> nums
        </PillButton>
      </PillGroup>
    </div>
  );
}
