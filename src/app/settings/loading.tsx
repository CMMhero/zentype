import {
  IconDeviceGamepad2,
  IconKeyboard,
  IconPalette,
  IconPlayerPlay,
  IconRefresh,
  IconSettingsFilled,
  IconUser,
  IconVolume,
} from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SelectSkeleton, Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

/**
 * Loading placeholders for settings controls. Buttons carry only static
 * content, so they're rendered as real controls; only elements whose shown
 * value depends on settings data (Switch state, Slider value, Select value)
 * get a skeleton, shaped to match the real control.
 */
type ControlKind = "switch" | "slider" | "select-play" | "button";

function ControlSkeleton({ kind }: { kind: ControlKind }) {
  switch (kind) {
    case "switch":
      return <Skeleton className="h-5 w-11 shrink-0 rounded-full" />;
    case "slider":
      // Track + thumb, matching the volume Slider's w-32 sm:w-40 width
      return (
        <div className="relative h-6 w-32 shrink-0 sm:w-40">
          <Skeleton className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full" />
          <Skeleton className="absolute top-1/2 left-1/4 h-4 w-6 -translate-y-1/2 rounded-full" />
        </div>
      );
    case "select-play":
      // Variant row: Select trigger (its value is data) + icon-only preview Button (static)
      return (
        <div className="flex shrink-0 items-center gap-2">
          <SelectSkeleton className="h-8 w-20" />
          <Button
            variant="outline"
            size="sm"
            className="pointer-events-none size-8 shrink-0 p-0"
            aria-hidden
            tabIndex={-1}
          >
            <IconPlayerPlay className="size-3" />
          </Button>
        </div>
      );
    case "button":
      // "play error" outline button — static label, render the real control
      return (
        <Button
          variant="outline"
          size="sm"
          className="pointer-events-none shrink-0 gap-1.5"
          aria-hidden
          tabIndex={-1}
        >
          <IconPlayerPlay className="size-3" /> play error
        </Button>
      );
  }
}

function SettingRowSkeleton({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: ControlKind;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <span className="text-sm">{label}</span>
        {hint && <p className="text-muted-foreground text-xs leading-snug">{hint}</p>}
      </div>
      <ControlSkeleton kind={control} />
    </div>
  );
}

const SOUND_ROWS: Array<{ label: string; hint?: string; control: ControlKind }> = [
  { label: "enabled", hint: "play sounds when you type", control: "switch" },
  { label: "volume", control: "slider" },
  { label: "variant", control: "select-play" },
  {
    label: "error sound",
    hint: "play a sound when you type an incorrect character",
    control: "switch",
  },
  { label: "error sound preview", control: "button" },
];

const RULES_ROWS: Array<{ label: string; hint?: string; control: ControlKind }> = [
  { label: "stop on error", hint: "pause until you fix the wrong letter", control: "switch" },
  { label: "strict space", hint: "wrong words can't be skipped with space", control: "switch" },
  {
    label: "free backspace",
    hint: "backspace at a word start restores the previous word",
    control: "switch",
  },
  {
    label: "blind mode",
    hint: "don't show which letters are wrong while typing",
    control: "switch",
  },
  { label: "hide live stats", hint: "don't show wpm/accuracy during the test", control: "switch" },
  {
    label: "hide progress",
    hint: "don't show time/word count and progress bar",
    control: "switch",
  },
];

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Header — static chrome, rendered as the real button */}
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettingsFilled className="text-primary size-5" /> settings
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="pointer-events-none text-muted-foreground gap-2 text-xs"
          aria-hidden
          tabIndex={-1}
        >
          <IconRefresh className="size-3.5" /> restore defaults
        </Button>
      </header>

      {/* Tabs — exact same structure as real settings page */}
      <Tabs defaultValue="gameplay" className="w-full min-w-0 gap-4" aria-label="Settings tabs">
        <TabsList className="w-full sm:w-fit sm:flex-none">
          <TabsTrigger value="gameplay" className="flex-1 gap-1.5 sm:flex-none">
            <IconDeviceGamepad2 className="size-4" />{" "}
            <span className="hidden min-[480px]:inline">gameplay</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 gap-1.5 sm:flex-none">
            <IconPalette className="size-4" />{" "}
            <span className="hidden min-[480px]:inline">appearance</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5 sm:flex-none">
            <IconUser className="size-4" />{" "}
            <span className="hidden min-[480px]:inline">account</span>
          </TabsTrigger>
          <TabsTrigger value="keybinds" className="flex-1 gap-1.5 sm:flex-none">
            <IconKeyboard className="size-4" />{" "}
            <span className="hidden min-[480px]:inline">keybinds</span>
          </TabsTrigger>
        </TabsList>

        {/* Gameplay tab content — all text and icons rendered, only controls skeleton */}
        <div className="flex w-full flex-col gap-4">
          <Card className="w-full gap-3 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
                <IconVolume className="size-4" /> sound feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {SOUND_ROWS.map((row) => (
                <SettingRowSkeleton key={row.label} {...row} />
              ))}
            </CardContent>
          </Card>

          <Card className="w-full gap-3 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
                <IconDeviceGamepad2 className="size-4" /> typing rules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {RULES_ROWS.map((row) => (
                <SettingRowSkeleton key={row.label} {...row} />
              ))}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
