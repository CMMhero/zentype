import { IconTypography, IconClock, IconHash, IconAt } from "@tabler/icons-react";
import { cn } from "~/lib/utils";
import { PillGroup, PillButton } from "~/components/ui/pill-toggle";
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  type GameMode,
} from "~/lib/types";

interface ConfigBarProps {
  mode: GameMode;
  duration: number;
  wordCount: number;
  locked: boolean;
  punctuation: boolean;
  numbers: boolean;
  onChange: (patch: { mode?: GameMode; duration?: number; wordCount?: number; punctuation?: boolean; numbers?: boolean }) => void;
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
        locked ? "pointer-events-none opacity-40" : "opacity-100"
      )}
      role="toolbar"
      aria-label="test configuration"
    >
      <div className="grid w-full grid-cols-[3fr_7fr] gap-2 sm:w-fit sm:grid-cols-none sm:flex sm:gap-2">
        {/* Mode selector */}
        <PillGroup>
          <PillButton
            active={mode === "time"}
            onClick={() => onChange({ mode: "time" })}
            aria-label="time mode"
          >
            <IconClock className="size-3.5" /> time
          </PillButton>
          <PillButton
            active={mode === "words"}
            onClick={() => onChange({ mode: "words" })}
            aria-label="words mode"
          >
            <IconTypography className="size-3.5" /> words
          </PillButton>
        </PillGroup>

        {/* Variant selector */}
        <PillGroup className="w-full min-w-0 overflow-hidden sm:w-64">
          {mode === "time"
            ? TIME_OPTIONS.map((t) => (
                <PillButton
                  key={t}
                  active={duration === t}
                  onClick={() => onChange({ duration: t })}
                  aria-label={`${t} seconds`}
                >
                  {t}s
                </PillButton>
              ))
            : WORD_OPTIONS.map((w) => (
                <PillButton
                  key={w}
                  active={wordCount === w}
                  onClick={() => onChange({ wordCount: w })}
                  aria-label={`${w} words`}
                >
                  {w}
                </PillButton>
              ))}
        </PillGroup>
      </div>

      {/* Punctuation & numbers toggles */}
      <PillGroup>
        <PillButton
          active={punctuation}
          onClick={() => onChange({ punctuation: !punctuation })}
          aria-label="toggle punctuation"
        >
          <IconAt className="size-3.5" /> punct
        </PillButton>
        <PillButton
          active={numbers}
          onClick={() => onChange({ numbers: !numbers })}
          aria-label="toggle numbers"
        >
          <IconHash className="size-3.5" /> nums
        </PillButton>
      </PillGroup>
    </div>
  );
}
