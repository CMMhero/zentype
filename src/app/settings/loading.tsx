import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  IconDeviceGamepad2, IconKeyboard,
  IconPalette, IconSettingsFilled, IconUser, IconVolume,
} from "@tabler/icons-react";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Header — fully rendered */}
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettingsFilled className="text-primary size-5" /> settings
        </h1>
        <span className="text-muted-foreground text-xs">restore defaults</span>
      </header>

      {/* Tabs — fully rendered */}
      <div className="w-full gap-4">
        <div className="bg-muted/50 flex w-full gap-1 rounded-lg p-1 sm:w-fit sm:flex-none">
          {[
            { icon: <IconDeviceGamepad2 className="size-4" />, label: "gameplay" },
            { icon: <IconPalette className="size-4" />, label: "appearance" },
            { icon: <IconUser className="size-4" />, label: "account" },
            { icon: <IconKeyboard className="size-4" />, label: "keybinds" },
          ].map(({ icon, label }) => (
            <button
              key={label}
              className="bg-background flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm sm:flex-none"
              disabled
            >
              {icon} <span className="hidden min-[480px]:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Gameplay tab content — all text and icons rendered, only controls skeleton */}
        <div className="flex w-full flex-col gap-4 pt-4">
          <Card className="w-full py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <IconVolume className="size-4" /> sound feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
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

          <Card className="mt-4 w-full py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <IconDeviceGamepad2 className="size-4" /> typing rules
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
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
      </div>
    </div>
  );
}
