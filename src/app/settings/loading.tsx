import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Header — static, no data needed */}
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-primary size-5 inline-block" /> settings
        </h1>
        <span className="text-muted-foreground text-xs">restore defaults</span>
      </header>

      {/* Tabs — static structure */}
      <div className="w-full gap-4">
        <div className="bg-muted/50 flex w-full gap-1 rounded-lg p-1 sm:w-fit sm:flex-none">
          {["gameplay", "appearance", "account", "keybinds"].map((t) => (
            <div key={t} className="flex-1 sm:flex-none">
              <Skeleton className="h-9 w-full sm:w-24" />
            </div>
          ))}
        </div>

        {/* Gameplay tab content — render labels, skeleton controls */}
        <div className="flex w-full flex-col gap-4 pt-4">
          <Card className="w-full py-4">
            <CardHeader className="px-4 pb-0">
              <div className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <Skeleton className="size-4" /> <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
              {["enabled", "volume", "variant", "error sound", "error sound preview"].map((label) => (
                <div key={label} className="flex items-center justify-between gap-4 py-0.5">
                  <span className="text-sm">{label}</span>
                  <Skeleton className="h-6 w-12 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="w-full py-4">
            <CardHeader className="px-4 pb-0">
              <div className="flex items-center gap-2 text-xs tracking-widest uppercase">
                <Skeleton className="size-4" /> <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
              {["stop on error", "strict space", "free backspace", "blind mode", "hide live stats"].map((label) => (
                <div key={label} className="flex items-center justify-between gap-4 py-0.5">
                  <span className="text-sm">{label}</span>
                  <Skeleton className="h-6 w-12 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
