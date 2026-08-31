import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  IconDeviceGamepad2, IconKeyboard, IconRefresh,
  IconPalette, IconSettingsFilled, IconUser, IconVolume,
} from "@tabler/icons-react";

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
              <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <IconVolume className="size-4" /> sound feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {[
                { label: "enabled", hint: "play sounds when you type" },
                { label: "volume" },
                { label: "variant" },
                { label: "error sound", hint: "play a sound when you type an incorrect character" },
                { label: "error sound preview" },
              ].map(({ label, hint }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-0.5">
                  <div className="min-w-0">
                    <span className="text-sm">{label}</span>
                    {hint && <p className="text-muted-foreground text-xs leading-snug">{hint}</p>}
                  </div>
                  <Skeleton className="h-6 w-12 shrink-0 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="w-full gap-3 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <IconDeviceGamepad2 className="size-4" /> typing rules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {[
                { label: "stop on error", hint: "pause until you fix the wrong letter" },
                { label: "strict space", hint: "wrong words can't be skipped with space" },
                { label: "free backspace", hint: "backspace at a word start restores the previous word" },
                { label: "blind mode", hint: "don't show which letters are wrong while typing" },
                { label: "hide live stats", hint: "don't show wpm/accuracy during the test" },
              ].map(({ label, hint }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-0.5">
                  <div className="min-w-0">
                    <span className="text-sm">{label}</span>
                    {hint && <p className="text-muted-foreground text-xs leading-snug">{hint}</p>}
                  </div>
                  <Skeleton className="h-6 w-12 shrink-0 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
