import { IconClock, IconTypography } from "@tabler/icons-react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
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
  onChange: (patch: { mode?: GameMode; duration?: number; wordCount?: number }) => void;
}

export function ConfigBar({
  mode,
  duration,
  wordCount,
  locked,
  onChange,
}: ConfigBarProps) {
  return (
    <div
      className={`border-border bg-secondary/30 mx-auto flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-md border px-4 py-2 text-sm transition-opacity ${
        locked ? "pointer-events-none opacity-15" : "opacity-100"
      }`}
      role="toolbar"
      aria-label="test configuration"
    >
      <ToggleGroup
        type="single"
        size="sm"
        value={mode}
        onValueChange={(v) => v && onChange({ mode: v as GameMode })}
        aria-label="game mode"
      >
        <ToggleGroupItem value="time" className="gap-1.5" aria-label="time mode">
          <IconClock className="size-3.5" /> time
        </ToggleGroupItem>
        <ToggleGroupItem value="words" className="gap-1.5" aria-label="words mode">
          <IconTypography className="size-3.5" /> words
        </ToggleGroupItem>
      </ToggleGroup>

      <span className="bg-border h-4 w-px" aria-hidden />

      {mode === "time" ? (
        <ToggleGroup
          type="single"
          size="sm"
          value={String(duration)}
          onValueChange={(v) => v && onChange({ duration: Number(v) })}
          aria-label="duration"
        >
          {TIME_OPTIONS.map((t) => (
            <ToggleGroupItem key={t} value={String(t)}>
              {t}s
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <ToggleGroup
          type="single"
          size="sm"
          value={String(wordCount)}
          onValueChange={(v) => v && onChange({ wordCount: Number(v) })}
          aria-label="word count"
        >
          {WORD_OPTIONS.map((w) => (
            <ToggleGroupItem key={w} value={String(w)}>
              {w}w
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}


    </div>
  );
}
