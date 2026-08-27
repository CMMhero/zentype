"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight, IconBlender, IconClock, IconDeviceDesktop,
  IconEye, IconEyeOff, IconKeyboard, IconLayoutDashboard,
  IconLetterT, IconList, IconMoon, IconPlayerPlay, IconRefresh, IconSearch,
  IconSettings, IconSparkles, IconTypography, IconUser, IconVolume, IconVolumeOff,
} from "@tabler/icons-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "~/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useUiStore } from "~/stores/ui-store";
import { useSettingsStore } from "~/stores/settings-store";
import { THEMES } from "~/lib/themes";
import {
  TIME_OPTIONS, WORD_OPTIONS,
  type CaretStyle, type FontFamily, type FontSizeKey, type SoundVariant,
} from "~/lib/types";
import { playKeypress } from "~/lib/sound";
import { searchUsers } from "~/server/results";

const CARET_STYLES: { value: CaretStyle; label: string; desc: string }[] = [
  { value: "line", label: "line", desc: "thin blinking cursor" },
  { value: "block", label: "block", desc: "highlighted character block" },
  { value: "underline", label: "underline", desc: "line under the character" },
  { value: "off", label: "off", desc: "no visible caret" },
];

const FONT_SIZES: { value: FontSizeKey; label: string; desc: string }[] = [
  { value: "sm", label: "small", desc: "compact text" },
  { value: "md", label: "medium", desc: "balanced" },
  { value: "lg", label: "large", desc: "default, easy to read" },
  { value: "xl", label: "xlarge", desc: "extra large text" },
];

const SOUND_VARIANTS: { value: SoundVariant; label: string; desc: string }[] = [
  { value: "click", label: "click", desc: "sharp mechanical click" },
  { value: "thock", label: "thock", desc: "deep thocky sound" },
  { value: "beep", label: "beep", desc: "soft sine beep" },
];

const FONT_FAMILIES: { value: FontFamily; label: string; desc: string; cssVar: string }[] = [
  { value: "geist-mono", label: "Geist Mono", desc: "default monospace", cssVar: "var(--font-geist-mono)" },
  { value: "inter", label: "Inter", desc: "clean sans-serif", cssVar: "var(--font-inter)" },
  { value: "jetbrains-mono", label: "JetBrains Mono", desc: "developer monospace", cssVar: "var(--font-jetbrains-mono)" },
  { value: "dm-sans", label: "DM Sans", desc: "geometric sans-serif", cssVar: "var(--font-dm-sans)" },
  { value: "space-grotesk", label: "Space Grotesk", desc: "techy geometric", cssVar: "var(--font-space-grotesk)" },
  { value: "nunito-sans", label: "Nunito Sans", desc: "soft rounded sans", cssVar: "var(--font-nunito-sans)" },
  { value: "work-sans", label: "Work Sans", desc: "clean modern sans", cssVar: "var(--font-work-sans)" },
  { value: "playfair-display", label: "Playfair Display", desc: "elegant serif", cssVar: "var(--font-playfair-display)" },
  { value: "lora", label: "Lora", desc: "readable serif", cssVar: "var(--font-lora)" },
  { value: "merriweather", label: "Merriweather", desc: "sturdy serif", cssVar: "var(--font-merriweather)" },
];

interface UserResult {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  // debounced user search — always searches DB when there's input
  useEffect(() => {
    const q = userQuery.trim();
    if (!q) { setUserResults([]); setUserLoading(false); return; }
    setUserLoading(true);
    let cancelled = false;
    searchTimerRef.current = setTimeout(() => {
      void searchUsers(q)
        .then((r) => { if (!cancelled) { setUserResults(r); setUserLoading(false); } })
        .catch(() => { if (!cancelled) setUserLoading(false); });
    }, 250);
    return () => { cancelled = true; if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [userQuery]);

  const go = (to: string) => { setOpen(false); router.push(to); };
  const close = () => setOpen(false);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-xl" data-command-overlay="">
      <CommandInput placeholder="search users, settings, or commands…" onValueChange={setUserQuery} />
      <CommandList>
        <CommandEmpty>no matching command</CommandEmpty>

        {/* User search results — always shown when there's a query */}
        {userQuery.trim().length > 0 && (
          <CommandGroup heading="users">
            {userLoading && (
              <CommandItem disabled>
                <IconSearch className="size-4 opacity-50" />
                <span className="text-muted-foreground">searching users…</span>
              </CommandItem>
            )}
            {!userLoading && userResults.length === 0 && (
              <CommandItem disabled>
                <IconUser className="size-4 opacity-50" />
                <span className="text-muted-foreground">no users found</span>
              </CommandItem>
            )}
            {userResults.map((u) => (
              <CommandItem key={u.userId} onSelect={() => go(`/profile/${u.userId}`)}>
                <Avatar className="size-5">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                  <AvatarFallback className="rounded text-[9px] uppercase">{u.username.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{u.username}</span>
                <CommandDesc><IconArrowRight className="size-3" /> view profile</CommandDesc>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {userQuery.trim().length > 0 && <CommandSeparator />}

        <CommandGroup heading="navigate">
          <CommandItem onSelect={() => go("/")}><IconKeyboard /> test<Shortcut>alt+1</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/leaderboard")}><IconSparkles /> leaderboard<Shortcut>alt+2</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/profile")}><IconLayoutDashboard /> profile<Shortcut>alt+3</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/settings")}><IconSettings /> settings<Shortcut>alt+4</Shortcut></CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="actions">
          <CommandItem onSelect={() => { close(); window.dispatchEvent(new CustomEvent("zt:restart")); }}>
            <IconRefresh /> restart test<Shortcut>tab</Shortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="mode">
          {TIME_OPTIONS.map((t) => (
            <CommandItem key={`time-${t}`} onSelect={() => { update({ mode: "time", duration: t }); close(); }} className={active(settings.mode === "time" && settings.duration === t)}>
              <IconClock /> {t}s — time<CommandDesc>type for {t} seconds</CommandDesc>
            </CommandItem>
          ))}
          {WORD_OPTIONS.map((w) => (
            <CommandItem key={`words-${w}`} onSelect={() => { update({ mode: "words", wordCount: w }); close(); }} className={active(settings.mode === "words" && settings.wordCount === w)}>
              <IconLetterT /> {w}w — words<CommandDesc>type {w} words</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="theme">
          {THEMES.map((t) => (
            <CommandItem key={t.id} onSelect={() => { update({ themeId: t.id }); close(); }} className={active(settings.themeId === t.id)}>
              <IconMoon />
              <span className="mr-1.5 inline-flex gap-0.5" aria-hidden>
                <span className="size-3 rounded-sm border border-border" style={{ background: t.vars["--background"] }} />
                <span className="size-3 rounded-sm" style={{ background: t.vars["--primary"] }} />
              </span>
              {t.label}<CommandDesc>{t.appearance} theme</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="sound">
          <CommandItem onSelect={() => update({ sound: { ...settings.sound, enabled: !settings.sound.enabled } })}>
            {settings.sound.enabled ? <IconVolume /> : <IconVolumeOff />}
            sound {settings.sound.enabled ? "on" : "off"}<CommandDesc>enable or disable keystroke audio feedback</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ soundOnError: !settings.soundOnError })}>
            <IconBlender /> error sound {settings.soundOnError ? "on" : "off"}<CommandDesc>play a sound when you type an incorrect character</CommandDesc>
          </CommandItem>
          {SOUND_VARIANTS.map((v) => (
            <CommandItem key={v.value} onSelect={() => { update({ sound: { ...settings.sound, variant: v.value } }); playKeypress(v.value, settings.sound.volume); }} className={active(settings.sound.variant === v.value)}>
              <IconPlayerPlay /> {v.label}<CommandDesc>{v.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="caret">
          {CARET_STYLES.map((c) => (
            <CommandItem key={c.value} onSelect={() => { update({ caretStyle: c.value }); close(); }} className={active(settings.caretStyle === c.value)}>
              <IconTypography /> {c.label}<CommandDesc>{c.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font size">
          {FONT_SIZES.map((f) => (
            <CommandItem key={f.value} onSelect={() => { update({ fontSize: f.value }); close(); }} className={active(settings.fontSize === f.value)}>
              <IconDeviceDesktop /> {f.label}<CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font family">
          {FONT_FAMILIES.map((f) => (
            <CommandItem key={f.value} onSelect={() => { update({ fontFamily: f.value }); close(); }} className={active(settings.fontFamily === f.value)}>
              <IconTypography />
              <span style={{ fontFamily: f.cssVar }}>{f.label}</span>
              <CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="visible lines">
          {([1, 2, 3] as const).map((n) => (
            <CommandItem key={n} onSelect={() => { update({ visibleLines: n }); close(); }} className={active(settings.visibleLines === n)}>
              <IconList /> {n} line{n > 1 ? "s" : ""}<CommandDesc>show {n} line{n > 1 ? "s" : ""} of text at a time</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="gameplay">
          <CommandItem onSelect={() => update({ blindMode: !settings.blindMode })}>
            {settings.blindMode ? <IconEyeOff /> : <IconEye />}
            blind mode {settings.blindMode ? "on" : "off"}<CommandDesc>hide error coloring</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ stopOnError: !settings.stopOnError })}>
            <IconBlender /> stop on error {settings.stopOnError ? "on" : "off"}<CommandDesc>block cursor until fixed</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ strictSpace: !settings.strictSpace })}>
            <IconBlender /> strict space {settings.strictSpace ? "on" : "off"}<CommandDesc>wrong words can't be skipped</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ freeBackspace: !settings.freeBackspace })}>
            <IconRefresh /> free backspace {settings.freeBackspace ? "on" : "off"}<CommandDesc>restore previous word on backspace</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ hideLiveStats: !settings.hideLiveStats })}>
            <IconEyeOff /> hide live stats {settings.hideLiveStats ? "on" : "off"}<CommandDesc>blank wpm/acc while running</CommandDesc>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="appearance">
          <CommandItem onSelect={() => update({ showKeyboard: !settings.showKeyboard })}>
            <IconKeyboard /> virtual keyboard {settings.showKeyboard ? "on" : "off"}<CommandDesc>show key highlighter</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ smoothCaret: !settings.smoothCaret })}>
            <IconEye /> smooth caret {settings.smoothCaret ? "on" : "off"}<CommandDesc>animate caret movement</CommandDesc>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function active(isActive: boolean) {
  return isActive ? "text-primary bg-primary/10" : "";
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground ml-auto text-[10px] shrink-0">{children}</span>;
}

function CommandDesc({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground ml-auto text-[10px] shrink-0 flex items-center gap-1">{children}</span>;
}
