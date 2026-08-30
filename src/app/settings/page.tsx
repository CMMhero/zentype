"use client";

import { useState } from "react";
import {
  IconAlertTriangle, IconDownload, IconEye, IconDeviceGamepad2, IconKeyboard, IconSettingsFilled,
  IconPalette, IconPlayerPlay, IconRefresh, IconUser, IconVolume,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Kbd } from "~/components/ui/kbd";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator as Sep } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { THEMES } from "~/lib/themes";
import { Combobox, type ComboboxItem } from "~/components/ui/combobox";
import type { CaretStyle, FontFamily, FontSizeKey, SoundVariant } from "~/lib/types";
import { FONTS } from "~/lib/fonts";
import { CARET_STYLES, FONT_SIZES, SOUND_VARIANTS } from "~/lib/settings-options";
import { useResultsStore } from "~/stores/results-store";
import { useSettingsStore } from "~/stores/settings-store";
import { useUser } from "~/components/user-provider";
import { updateUsername } from "~/server/auth";
import { deleteMyData } from "~/server/results";
import { playKeypress, playError } from "~/lib/sound";

export default function SettingsPage() {
  const user = useUser();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettingsFilled className="text-primary size-5" /> settings
        </h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-xs">
              <IconRefresh className="size-3.5" /> restore defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore all settings to defaults?</AlertDialogTitle>
              <AlertDialogDescription>
                Resets your theme, font, sound, and gameplay settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { reset(); toast.info("Settings restored to defaults"); }}>yes, restore</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <Tabs defaultValue="gameplay" className="w-full min-w-0 gap-4" aria-label="Settings tabs">
        <TabsList className="w-full sm:w-fit sm:flex-none">
          <TabsTrigger value="gameplay" className="flex-1 gap-1.5 sm:flex-none"><IconDeviceGamepad2 className="size-4" /> <span className="hidden min-[480px]:inline">gameplay</span></TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 gap-1.5 sm:flex-none"><IconPalette className="size-4" /> <span className="hidden min-[480px]:inline">appearance</span></TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5 sm:flex-none"><IconUser className="size-4" /> <span className="hidden min-[480px]:inline">account</span></TabsTrigger>
          <TabsTrigger value="keybinds" className="flex-1 gap-1.5 sm:flex-none"><IconKeyboard className="size-4" /> <span className="hidden min-[480px]:inline">keybinds</span></TabsTrigger>
        </TabsList>

        <TabsContent value="gameplay" className="flex w-full flex-col gap-4 outline-none">
          <Card className="w-full py-4">
            <SectionTitle icon={<IconVolume className="size-4" />} title="sound feedback" />
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
              <SettingRow label="enabled" hint="play sounds when you type">
                <Switch checked={settings.sound.enabled} onCheckedChange={(v) => update({ sound: { ...settings.sound, enabled: v } })} />
              </SettingRow>
              <SettingRow label="volume">
                <Slider className="w-32 sm:w-40" min={0} max={100} value={[Math.round(settings.sound.volume * 100)]} onValueChange={([v]) => update({ sound: { ...settings.sound, volume: v / 100 } })} />
              </SettingRow>
              <SettingRow label="variant">
                <div className="flex items-center gap-2">
                  <Select value={settings.sound.variant} onValueChange={(v) => update({ sound: { ...settings.sound, variant: v as SoundVariant } })}>
                    <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOUND_VARIANTS.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="size-8 p-0" onClick={() => playKeypress(settings.sound.variant, settings.sound.volume)} title="preview sound">
                    <IconPlayerPlay className="size-3" />
                  </Button>
                </div>
              </SettingRow>
              <SettingRow label="error sound" hint="play a sound when you type an incorrect character">
                <Switch checked={settings.soundOnError} onCheckedChange={(v) => update({ soundOnError: v })} />
              </SettingRow>
              <SettingRow label="error sound preview">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => playError(settings.sound.volume)}>
                  <IconPlayerPlay className="size-3" /> play error
                </Button>
              </SettingRow>
            </CardContent>
          </Card>

          <Card className="w-full py-4">
            <SectionTitle icon={<IconDeviceGamepad2 className="size-4" />} title="typing rules" />
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
              <SettingRow label="stop on error" hint="pause until you fix the wrong letter">
                <Switch checked={settings.stopOnError} onCheckedChange={(v) => update({ stopOnError: v })} />
              </SettingRow>
              <SettingRow label="strict space" hint="wrong words can't be skipped with space">
                <Switch checked={settings.strictSpace} onCheckedChange={(v) => update({ strictSpace: v })} />
              </SettingRow>
              <SettingRow label="free backspace" hint="backspace at a word start restores the previous word">
                <Switch checked={settings.freeBackspace} onCheckedChange={(v) => update({ freeBackspace: v })} />
              </SettingRow>
              <SettingRow label="blind mode" hint="don't show which letters are wrong while typing">
                <Switch checked={settings.blindMode} onCheckedChange={(v) => update({ blindMode: v })} />
              </SettingRow>
              <SettingRow label="hide live stats" hint="don't show wpm/accuracy during the test">
                <Switch checked={settings.hideLiveStats} onCheckedChange={(v) => update({ hideLiveStats: v })} />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="flex min-w-0 flex-col gap-4 outline-none">
          <Card className="w-full min-w-0 py-4">
            <SectionTitle icon={<IconPalette className="size-4" />} title="theme" />
            <CardContent className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-3 md:grid-cols-4">
              {[...THEMES].sort((a, b) => a.label.localeCompare(b.label)).map((t) => (
                <Button key={t.id} variant="outline" onClick={() => update({ themeId: t.id })} className={`h-auto w-full min-w-0 justify-start gap-2 rounded-md border-border bg-transparent p-2 text-left shadow-none hover:bg-transparent ${settings.themeId === t.id ? "border-primary ring-ring/40 ring-1" : "hover:border-primary"}`}>
                  <span className="flex shrink-0 overflow-hidden rounded-sm border border-black/20">
                    <span className="size-5" style={{ background: t.vars["--background"] }} />
                    <span className="size-5" style={{ background: t.vars["--primary"] }} />
                    <span className="size-5" style={{ background: t.vars["--zt-sub"] }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">{t.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="w-full py-4">
            <SectionTitle icon={<IconEye className="size-4" />} title="display" />
            <CardContent className="mt-3 flex flex-col gap-4 px-4">
              <SettingRow label="caret style">
                <div className="flex items-center gap-3">
                  <CaretPreview style={settings.caretStyle} />
                  <Select value={settings.caretStyle} onValueChange={(v) => update({ caretStyle: v as CaretStyle })}>
                    <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARET_STYLES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </SettingRow>
              <SettingRow label="smooth caret" hint="animate caret movement between chars">
                <Switch checked={settings.smoothCaret} onCheckedChange={(v) => update({ smoothCaret: v })} />
              </SettingRow>

              <SettingRow label="font">
                <Combobox
                  items={FONT_ITEMS}
                  value={settings.fontFamily}
                  onValueChange={(v) => update({ fontFamily: v as FontFamily })}
                  placeholder="Font"
                  searchPlaceholder="Search fonts…"
                  className="h-8 w-full sm:w-56"
                />
              </SettingRow>
              <SettingRow label="font size">
                <Select value={settings.fontSize} onValueChange={(v) => update({ fontSize: v as FontSizeKey })}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="visible lines" hint="how many lines of words stay in view">
                <Select value={String(settings.visibleLines)} onValueChange={(v) => update({ visibleLines: Number(v) as 1 | 2 | 3 })}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 line</SelectItem>
                    <SelectItem value="2">2 lines</SelectItem>
                    <SelectItem value="3">3 lines</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="virtual keyboard" hint="show key highlighter under the test">
                <Switch checked={settings.showKeyboard} onCheckedChange={(v) => update({ showKeyboard: v })} />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="flex w-full flex-col gap-4 outline-none">
          {user ? (
            <>
              <AccountCard username={user.username} email={user.email} />
              <DataCard signedIn />
            </>
          ) : (
            <Card className="w-full py-6">
              <CardContent className="flex flex-col items-center gap-3 px-4 text-center">
                <IconUser className="text-muted-foreground size-6" />
                <p className="text-muted-foreground text-sm">You're typing as a guest. Results live in this browser only.</p>
                <Button asChild size="sm"><a href="/login">login / Sign up →</a></Button>
              </CardContent>
            </Card>
          )}
          <DataExportCard />
          {!user && <GuestDataCard />}
        </TabsContent>

        <TabsContent value="keybinds" className="w-full outline-none">
          <Card className="w-full py-4">
            <CardContent className="px-4">
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {KEYBINDS.map(([keys, action]) => (
                  <div key={action} className="hover:bg-muted/50 flex items-center justify-between rounded px-2 py-2">
                    <span className="text-muted-foreground text-sm">{action}</span>
                    <span className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground text-[10px]">+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountCard({ username, email }: { username: string; email: string }) {
  const [value, setValue] = useState(username);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await updateUsername(value);
      if (res.error) toast.error(res.error);
      else { toast.success("Username updated"); setTimeout(() => window.location.reload(), 400); }
    } finally { setSaving(false); }
  }

  return (
    <Card className="w-full py-4">
      <SectionTitle icon={<IconUser className="size-4" />} title="profile" />
      <CardContent className="mt-3 flex flex-col gap-3 px-4">
        <div className="grid gap-1">
          <Label htmlFor="username" className="text-xs">display name</Label>
          <div className="flex gap-2">
            <Input id="username" value={value} onChange={(e) => setValue(e.target.value)} maxLength={24} className="max-w-64" />
            <Button size="sm" onClick={save} disabled={saving || value === username}>{saving ? "saving…" : "save"}</Button>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">3–24 characters · letters, numbers and underscores · shown on leaderboards</p>
        </div>
        <Sep />
        <p className="text-muted-foreground text-xs">{email}</p>
      </CardContent>
    </Card>
  );
}

function DataExportCard() {
  const local = useResultsStore((s) => s.local);
  function exportAll() {
    const payload = { exportedAt: new Date().toISOString(), app: "zentype", version: 2, localResults: local };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zentype-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card className="w-full py-4">
      <SectionTitle icon={<IconDownload className="size-4" />} title="your data" />
      <CardContent className="mt-3 px-4">
        <p className="text-muted-foreground mb-3 text-sm">download everything stored for you</p>
        <Button variant="outline" size="sm" onClick={exportAll}><IconDownload className="size-4" /> export json</Button>
      </CardContent>
    </Card>
  );
}

function GuestDataCard() {
  const local = useResultsStore((s) => s.local);
  const clearLocal = useResultsStore((s) => s.clearLocal);
  if (local.length === 0) return null;
  return (
    <Card className="w-full py-4">
      <SectionTitle icon={<IconAlertTriangle className="size-4" />} title={`local guest queue (${local.length} result${local.length === 1 ? "" : "s"})`} />
      <CardContent className="mt-3 px-4">
        <p className="text-muted-foreground mb-3 text-sm">these will sync automatically when you log in.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">discard local results</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard {local.length} local result{local.length === 1 ? "" : "s"}?</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently deletes your local guest results. Cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => clearLocal()}>yes, discard</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function DataCard({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) return null;
  return (
    <Card className="w-full border-destructive/40 py-4">
      <SectionTitle icon={<IconAlertTriangle className="size-4 text-destructive" />} title="danger zone" />
      <CardContent className="mt-3 px-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">delete all my test results</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete every saved result?</AlertDialogTitle>
              <AlertDialogDescription>Permanently removes all test history from the server. Cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                const res = await deleteMyData();
                toast[res.ok ? "success" : "error"](res.ok ? "all results deleted" : "deletion failed");
              }}>yes, delete everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <CardHeader className="px-4 pb-0">
      <CardTitle className="flex items-center gap-2 text-xs tracking-widest uppercase">{icon} {title}</CardTitle>
    </CardHeader>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div className="min-w-0">
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-muted-foreground text-xs leading-snug">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CaretPreview({ style }: { style: CaretStyle }) {
  return (
    <div className="bg-muted/50 flex h-9 w-16 items-center justify-center rounded border border-border/50">
      {style === "off" ? (
        <span className="text-muted-foreground text-[10px]">none</span>
      ) : (
        <div className="relative">
          <span className="text-sm font-medium">Aa</span>
          {style === "line" && (
            <div className="zt-caret-blink bg-primary absolute top-0 h-4 w-0.5 rounded-full" style={{ left: "50%" }} />
          )}
          {style === "block" && (
            <div className="zt-caret-blink bg-primary/40 absolute inset-0 rounded-sm" />
          )}
          {style === "underline" && (
            <div className="zt-caret-blink bg-primary absolute bottom-0 h-0.5 w-full rounded-full" />
          )}
        </div>
      )}
    </div>
  );
}

const KEYBINDS: Array<[string[], string]> = [
  [["tab"], "restart / new test"],
  [["enter"], "next test (results screen)"],
  [["ctrl", "k"], "command palette"],
  [["?"], "shortcut reference"],
  [["esc"], "close dialogs"],
  [["alt", "1"], "test page"],
  [["alt", "2"], "leaderboard"],
  [["alt", "3"], "profile"],
  [["alt", "4"], "settings"],
  [["backspace"], "fix current word"],
];

const FONT_ITEMS: ComboboxItem[] = FONTS.map((f) => ({
  value: f.value,
  label: f.label,
  fontCssVar: f.cssVar,
}));
