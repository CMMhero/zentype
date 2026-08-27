"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenText, Clapperboard, Eye, EyeOff, FlipVertical2, Globe, History, Keyboard, LayoutDashboard,
  LetterText, List, Moon, RotateCcw, Settings, Trophy, Type, Volume2, VolumeX,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "~/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useUiStore } from "~/stores/ui-store";
import { useSettingsStore } from "~/stores/settings-store";
import { THEMES } from "~/lib/themes";
import {
  SOURCE_LABELS, TIME_OPTIONS, WORD_OPTIONS,
  type CaretStyle, type FontFamily, type FontSizeKey, type PromptSource, type SoundVariant,
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

const FONT_FAMILIES: { value: FontFamily; label: string; desc: string }[] = [
  { value: "geist-mono", label: "Geist Mono", desc: "default monospace" },
  { value: "inter", label: "Inter", desc: "clean sans-serif" },
  { value: "jetbrains-mono", label: "JetBrains Mono", desc: "developer monospace" },
  { value: "sans", label: "System Sans", desc: "system ui sans-serif" },
  { value: "serif", label: "Serif", desc: "classic serif" },
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

  // debounced user search
  useEffect(() => {
    if (!userQuery.trim()) { setUserResults([]); return; }
    const t = setTimeout(() => {
      void searchUsers(userQuery).then(setUserResults);
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const go = (to: string) => { setOpen(false); router.push(to); };
  const close = () => setOpen(false);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-xl" data-command-overlay="">
      <CommandInput placeholder="type a command or search…" onValueChange={setUserQuery} />
      <CommandList>
        <CommandEmpty>no matching command</CommandEmpty>

        {/* user search results */}
        {userQuery.trim() && userResults.length > 0 && (
          <>
            <CommandGroup heading="users">
              {userResults.map((u) => (
                <CommandItem key={u.userId} onSelect={() => go(`/profile/${u.userId}`)}>
                  <Avatar className="size-5">
                    {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                    <AvatarFallback className="rounded text-[9px] uppercase">{u.username.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{u.username}</span>
                  <CommandDesc>view profile</CommandDesc>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="navigate">
          <CommandItem onSelect={() => go("/")}><Type /> test<Shortcut>alt+1</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/leaderboard")}><Trophy /> leaderboard<Shortcut>alt+2</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/profile")}><LayoutDashboard /> profile<Shortcut>alt+3</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/history")}><History /> history<Shortcut>alt+4</Shortcut></CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings /> settings<Shortcut>alt+5</Shortcut></CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="actions">
          <CommandItem onSelect={() => { close(); window.dispatchEvent(new CustomEvent("zt:restart")); }}>
            <RotateCcw /> restart test<Shortcut>tab</Shortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="mode">
          {TIME_OPTIONS.map((t) => (
            <CommandItem key={`time-${t}`} onSelect={() => { update({ mode: "time", duration: t }); close(); }} className={active(settings.mode === "time" && settings.duration === t)}>
              <span className="text-primary w-14">time</span> {t}s<CommandDesc>type for {t} seconds</CommandDesc>
            </CommandItem>
          ))}
          {WORD_OPTIONS.map((w) => (
            <CommandItem key={`words-${w}`} onSelect={() => { update({ mode: "words", wordCount: w }); close(); }} className={active(settings.mode === "words" && settings.wordCount === w)}>
              <span className="text-primary w-14">words</span> {w}w<CommandDesc>type {w} words</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="prompt source">
          {([
            ["words", LetterText, "random english words"],
            ["quotes", BookOpenText, "famous quotes"],
            ["anime", Clapperboard, "anime synopses"],
            ["wiki", Globe, "wikipedia extracts"],
            ["dictionary", BookOpenText, "dictionary definitions"],
          ] as [PromptSource, typeof Globe, string][]).map(([src, Icon, desc]) => (
            <CommandItem key={src} onSelect={() => { update({ source: src }); close(); }} className={active(settings.source === src)}>
              <Icon /> {SOURCE_LABELS[src]}<CommandDesc>{desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="theme">
          {THEMES.map((t) => (
            <CommandItem key={t.id} onSelect={() => { update({ themeId: t.id }); close(); }} className={active(settings.themeId === t.id)}>
              <Moon />
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
            {settings.sound.enabled ? <Volume2 /> : <VolumeX />}
            sound {settings.sound.enabled ? "on" : "off"}<CommandDesc>enable or disable keystroke audio feedback</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ soundOnError: !settings.soundOnError })}>
            error sound {settings.soundOnError ? "on" : "off"}<CommandDesc>play a sound when you type an incorrect character</CommandDesc>
          </CommandItem>
          {SOUND_VARIANTS.map((v) => (
            <CommandItem key={v.value} onSelect={() => { update({ sound: { ...settings.sound, variant: v.value } }); playKeypress(v.value, settings.sound.volume); }} className={active(settings.sound.variant === v.value)}>
              <span className="text-primary w-14">{v.label}</span> sound variant<CommandDesc>{v.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="caret style">
          {CARET_STYLES.map((c) => (
            <CommandItem key={c.value} onSelect={() => { update({ caretStyle: c.value }); close(); }} className={active(settings.caretStyle === c.value)}>
              <Type /> {c.label}<CommandDesc>{c.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font size">
          {FONT_SIZES.map((f) => (
            <CommandItem key={f.value} onSelect={() => { update({ fontSize: f.value }); close(); }} className={active(settings.fontSize === f.value)}>
              <Type /> {f.label}<CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="visible lines">
          {([1, 2, 3] as const).map((n) => (
            <CommandItem key={n} onSelect={() => { update({ visibleLines: n }); close(); }} className={active(settings.visibleLines === n)}>
              <List /> {n} line{n > 1 ? "s" : ""}<CommandDesc>show {n} line{n > 1 ? "s" : ""} of text at a time</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="gameplay">
          <CommandItem onSelect={() => update({ blindMode: !settings.blindMode })}>
            {settings.blindMode ? <EyeOff /> : <Eye />}
            blind mode {settings.blindMode ? "on" : "off"}<CommandDesc>hide error coloring</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ stopOnError: !settings.stopOnError })}>
            stop on error {settings.stopOnError ? "on" : "off"}<CommandDesc>block cursor until fixed</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ strictSpace: !settings.strictSpace })}>
            strict space {settings.strictSpace ? "on" : "off"}<CommandDesc>wrong words can't be skipped</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ freeBackspace: !settings.freeBackspace })}>
            free backspace {settings.freeBackspace ? "on" : "off"}<CommandDesc>restore previous word on backspace</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ hideLiveStats: !settings.hideLiveStats })}>
            hide live stats {settings.hideLiveStats ? "on" : "off"}<CommandDesc>blank wpm/acc while running</CommandDesc>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="appearance">
          <CommandItem onSelect={() => update({ showKeyboard: !settings.showKeyboard })}>
            <Keyboard /> virtual keyboard {settings.showKeyboard ? "on" : "off"}<CommandDesc>show key highlighter</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ smoothCaret: !settings.smoothCaret })}>
            <Eye /> smooth caret {settings.smoothCaret ? "on" : "off"}<CommandDesc>animate caret movement</CommandDesc>
          </CommandItem>
          <CommandItem onSelect={() => update({ flipColors: !settings.flipColors })}>
            <FlipVertical2 /> flip colors {settings.flipColors ? "on" : "off"}<CommandDesc>invert the entire ui</CommandDesc>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font">
          {FONT_FAMILIES.map((f) => (
            <CommandItem key={f.value} onSelect={() => { update({ fontFamily: f.value }); close(); }} className={active(settings.fontFamily === f.value)}>
              <Type /> {f.label}<CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
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
  return <span className="text-muted-foreground ml-auto text-[10px] shrink-0">{children}</span>;
}
