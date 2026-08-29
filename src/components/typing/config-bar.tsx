import { IconClock, IconTypography } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
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
      className={cn(
        "mx-auto flex w-fit flex-wrap items-center justify-center gap-2 text-sm transition-all duration-300",
        locked ? "pointer-events-none opacity-40" : "opacity-100"
      )}
      role="toolbar"
      aria-label="test configuration"
    >
      {/* Mode selector — pill style like Tabs */}
      <div className="bg-muted/80 inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px] sm:w-auto">
        <ConfigButton
          active={mode === "time"}
          onClick={() => onChange({ mode: "time" })}
          aria-label="time mode"
        >
          <IconClock className="size-3.5" /> time
        </ConfigButton>
        <ConfigButton
          active={mode === "words"}
          onClick={() => onChange({ mode: "words" })}
          aria-label="words mode"
        >
          <IconTypography className="size-3.5" /> words
        </ConfigButton>
      </div>

      {/* Variant selector — pill style like Tabs, responsive width */}
      <div className="bg-muted/80 inline-flex h-9 w-full max-w-64 items-center justify-center rounded-lg p-[3px] sm:w-64">
        {mode === "time"
          ? TIME_OPTIONS.map((t) => (
              <ConfigButton
                key={t}
                active={duration === t}
                onClick={() => onChange({ duration: t })}
                aria-label={`${t} seconds`}
              >
                {t}s
              </ConfigButton>
            ))
          : WORD_OPTIONS.map((w) => (
              <ConfigButton
                key={w}
                active={wordCount === w}
                onClick={() => onChange({ wordCount: w })}
                aria-label={`${w} words`}
              >
                {w}w
              </ConfigButton>
            ))}
      </div>
    </div>
  );
}

function ConfigButton({
  active,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { active: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-[calc(100%-2px)] flex-1 gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium hover:bg-transparent",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        props.className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
