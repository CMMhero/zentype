import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  IconDeviceGamepad2, IconKeyboard, IconRefresh,
  IconPalette, IconSettingsFilled, IconUser, IconVolume,
} from "@tabler/icons-react";

/** Placeholders sized to mirror the real settings controls (Switch, Slider, Select + Button). */
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
      // Variant row: Select trigger + icon-only preview button
      return (
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      );
    case "button":
      // "play error" outline button
      return <Skeleton className="h-8 w-24 shrink-0 rounded-md" />;
  }
}

function SettingRowSkeleton({ label, hint, control }: { label: string; hint?: string; control: ControlKind }) {
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
  { label: "error sound", hint: "play a sound when you type an incorrect character", control: "switch" },
  { label: "error sound preview", control: "button" },
];

const RULES_ROWS: Array<{ label: string; hint?: string; control: ControlKind }> = [
  { label: "stop on error", hint: "pause until you fix the wrong letter", control: "switch" },
  { label: "strict space", hint: "wrong words can't be skipped with space", control: "switch" },
  { label: "free backspace", hint: "backspace at a word start restores the previous word", control: "switch" },
  { label: "blind mode", hint: "don't show which letters are wrong while typing", control: "switch" },
  { label: "hide live stats", hint: "don't show wpm/accuracy during the test", control: "switch" },
  { label: "hide progress", hint: "don't show time/word count and progress bar", control: "switch" },
];

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Header — fully rendered, matches real Button sizing */}
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettingsFilled className="text-primary size-5" /> settings
        </h1>
        <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs">
          <IconRefresh className="size-3.5" /> restore defaults
        </span>
      </header>

      {/* Tabs — exact same structure as real settings page */}
      <Tabs defaultValue="gameplay" className="w-full min-w-0 gap-4" aria-label="Settings tabs">
        <TabsList className="w-full sm:w-fit sm:flex-none">
          <TabsTrigger value="gameplay" className="flex-1 gap-1.5 sm:flex-none"><IconDeviceGamepad2 className="size-4" /> <span className="hidden min-[480px]:inline">gameplay</span></TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 gap-1.5 sm:flex-none"><IconPalette className="size-4" /> <span className="hidden min-[480px]:inline">appearance</span></TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5 sm:flex-none"><IconUser className="size-4" /> <span className="hidden min-[480px]:inline">account</span></TabsTrigger>
          <TabsTrigger value="keybinds" className="flex-1 gap-1.5 sm:flex-none"><IconKeyboard className="size-4" /> <span className="hidden min-[480px]:inline">keybinds</span></TabsTrigger>
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
              {SOUND_ROWS.map((row) => <SettingRowSkeleton key={row.label} {...row} />)}
            </CardContent>
          </Card>

          <Card className="w-full gap-3 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
                <IconDeviceGamepad2 className="size-4" /> typing rules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {RULES_ROWS.map((row) => <SettingRowSkeleton key={row.label} {...row} />)}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}