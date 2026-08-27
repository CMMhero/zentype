import { IconBook, IconMovie, IconClock, IconGlobe, IconLetterT, IconTypography } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Kbd } from "~/components/ui/kbd";
import {
  SOURCE_LABELS,
  TIME_OPTIONS,
  WORD_OPTIONS,
  type GameMode,
  type PromptSource,
} from "~/lib/types";

interface ConfigBarProps {
  mode: GameMode;
  duration: number;
  wordCount: number;
  source: PromptSource;
  locked: boolean;
  onChange: (patch: { mode?: GameMode; duration?: number; wordCount?: number; source?: PromptSource }) => void;
}

const SOURCE_ICONS = {
  words: IconLetterT,
  quotes: IconBook,
  anime: IconMovie,
  wiki: IconGlobe,
  dictionary: IconBook,
} as const;

export function ConfigBar({
  mode,
  duration,
  wordCount,
  source,
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

      <span className="bg-border h-4 w-px" aria-hidden />

      <Select value={source} onValueChange={(v) => onChange({ source: v as PromptSource })}>
        <SelectTrigger
          size="sm"
          className="text-muted-foreground hover:text-foreground w-[9.5rem] border-none shadow-none"
          aria-label="prompt source"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SOURCE_LABELS) as PromptSource[]).map((s) => {
            const Icon = SOURCE_ICONS[s];
            return (
              <SelectItem key={s} value={s}>
                <Icon className="size-3.5" /> {SOURCE_LABELS[s]}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground ml-1 hidden items-center gap-1 lg:flex">
        <Kbd>tab</Kbd> new
      </span>
    </div>
  );
}
