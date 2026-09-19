import { IconAt, IconClock, IconHash, IconTypography } from "@tabler/icons-react";
import { PillButton, PillGroup } from "~/components/ui/pill-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
  const variantValue = String(mode === "time" ? duration : wordCount);
  const handleVariantChange = (next: string | null) => {
    if (next) onChange(mode === "time" ? { duration: Number(next) } : { wordCount: Number(next) });
  };
  const variantOptions =
    mode === "time"
      ? TIME_OPTIONS.map((t) => ({ value: String(t), label: `${t}s` }))
      : WORD_OPTIONS.map((w) => ({ value: String(w), label: `${w}` }));

  return (
    <div
      className={cn(
        "mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 text-sm transition-all duration-300 sm:gap-3",
        locked ? "pointer-events-none opacity-40" : "opacity-100",
      )}
      role="toolbar"
      aria-label="test configuration"
    >
      <div className="flex w-fit max-w-full min-w-0 items-center justify-center gap-2 sm:gap-2">
        {/* Mode selector — content-sized on all breakpoints, never stretched */}
        <PillGroup
          className="w-fit min-w-0"
          value={[mode]}
          onValueChange={(v) => {
            const next = v[0];
            if (next) onChange({ mode: next as GameMode });
          }}
        >
          <PillButton value="time" aria-label="time mode" className="flex-none">
            <IconClock className="size-3.5" /> time
          </PillButton>
          <PillButton value="words" aria-label="words mode" className="flex-none">
            <IconTypography className="size-3.5" /> words
          </PillButton>
        </PillGroup>

        {/* Variant selector: compact dropdown on mobile (the 4-pill rail is
            too wide and squeezes the mode pills), full pill rail on sm+. */}
        <div className="min-w-0 sm:hidden">
          <Select value={variantValue} onValueChange={handleVariantChange}>
            <SelectTrigger
              size="sm"
              aria-label={mode === "time" ? "test duration" : "word count"}
              className="w-20"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variantOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PillGroup
          className="hidden w-64 sm:inline-flex"
          value={[variantValue]}
          onValueChange={(v) => handleVariantChange(v[0] ?? "")}
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
