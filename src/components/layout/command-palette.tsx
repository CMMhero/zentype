"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight, IconBlender, IconClock, IconDeviceDesktop,
  IconEye, IconEyeOff, IconKeyboardFilled, IconLayoutDashboard,
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
  { value: "xs", label: "extra small", desc: "very compact text" },
  { value: "sm", label: "small", desc: "compact text" },
  { value: "md", label: "medium", desc: "balanced" },
  { value: "lg", label: "large", desc: "default, easy to read" },
  { value: "xl", label: "xlarge", desc: "extra large text" },
  { value: "2xl", label: "2xlarge", desc: "very large text" },
  { value: "3xl", label: "3xlarge", desc: "huge text" },
];

const SOUND_VARIANTS: { value: SoundVariant; label: string; desc: string }[] = [
  { value: "click", label: "click", desc: "sharp mechanical click" },
  { value: "thock", label: "thock", desc: "deep thocky sound" },
  { value: "beep", label: "beep", desc: "soft sine beep" },
];

const FONT_FAMILIES: { value: FontFamily; label: string; desc: string; cssVar: string }[] = [
  { value: "anonymous-pro", label: "Anonymous Pro", desc: "typewriter mono", cssVar: "var(--font-anonymous-pro)" },
  { value: "barlow", label: "Barlow", desc: "neo-grotesk sans", cssVar: "var(--font-barlow)" },
  { value: "bitter", label: "Bitter", desc: "slab serif", cssVar: "var(--font-bitter)" },
  { value: "cabin", label: "Cabin", desc: "humanist sans", cssVar: "var(--font-cabin)" },
  { value: "cascadia-code", label: "Cascadia Code", desc: "microsoft mono", cssVar: "var(--font-cascadia-code)" },
  { value: "commit-mono", label: "Commit Mono", desc: "neutral mono", cssVar: "var(--font-commit-mono)" },
  { value: "crimson-pro", label: "Crimson Pro", desc: "old-style serif", cssVar: "var(--font-crimson-pro)" },
  { value: "dm-sans", label: "DM Sans", desc: "geometric sans-serif", cssVar: "var(--font-dm-sans)" },
  { value: "exo-2", label: "Exo 2", desc: "geometric sans", cssVar: "var(--font-exo-2)" },
  { value: "fira-code", label: "Fira Code", desc: "ligature monospace", cssVar: "var(--font-fira-code)" },
  { value: "geist-mono", label: "Geist Mono", desc: "default monospace", cssVar: "var(--font-geist-mono)" },
  { value: "ibm-plex-mono", label: "IBM Plex Mono", desc: "ibm monospace", cssVar: "var(--font-ibm-plex-mono)" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", desc: "corporate sans-serif", cssVar: "var(--font-ibm-plex-sans)" },
  { value: "inconsolata", label: "Inconsolata", desc: "humanist mono", cssVar: "var(--font-inconsolata)" },
  { value: "inter", label: "Inter", desc: "clean sans-serif", cssVar: "var(--font-inter)" },
  { value: "jetbrains-mono", label: "JetBrains Mono", desc: "developer monospace", cssVar: "var(--font-jetbrains-mono)" },
  { value: "josefin-sans", label: "Josefin Sans", desc: "geometric elegant", cssVar: "var(--font-josefin-sans)" },
  { value: "lato", label: "Lato", desc: "humanist sans", cssVar: "var(--font-lato)" },
  { value: "lexend", label: "Lexend", desc: "readable sans", cssVar: "var(--font-lexend)" },
  { value: "lora", label: "Lora", desc: "readable serif", cssVar: "var(--font-lora)" },
  { value: "manrope", label: "Manrope", desc: "modern geometric sans", cssVar: "var(--font-manrope)" },
  { value: "merriweather", label: "Merriweather", desc: "sturdy serif", cssVar: "var(--font-merriweather)" },
  { value: "montserrat", label: "Montserrat", desc: "urban sans", cssVar: "var(--font-montserrat)" },
  { value: "noto-sans", label: "Noto Sans", desc: "google sans", cssVar: "var(--font-noto-sans)" },
  { value: "noto-serif", label: "Noto Serif", desc: "google serif", cssVar: "var(--font-noto-serif)" },
  { value: "nunito-sans", label: "Nunito Sans", desc: "soft rounded sans", cssVar: "var(--font-nunito-sans)" },
  { value: "open-sans", label: "Open Sans", desc: "humanist sans", cssVar: "var(--font-open-sans)" },
  { value: "oswald", label: "Oswald", desc: "condensed sans", cssVar: "var(--font-oswald)" },
  { value: "outfit", label: "Outfit", desc: "geometric sans", cssVar: "var(--font-outfit)" },
  { value: "playfair-display", label: "Playfair Display", desc: "elegant serif", cssVar: "var(--font-playfair-display)" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", desc: "geometric sans", cssVar: "var(--font-plus-jakarta-sans)" },
  { value: "poppins", label: "Poppins", desc: "geometric sans", cssVar: "var(--font-poppins)" },
  { value: "pt-sans", label: "PT Sans", desc: "public type sans", cssVar: "var(--font-pt-sans)" },
  { value: "pt-serif", label: "PT Serif", desc: "public type serif", cssVar: "var(--font-pt-serif)" },
  { value: "raleway", label: "Raleway", desc: "elegant sans", cssVar: "var(--font-raleway)" },
  { value: "roboto-flex", label: "Roboto Flex", desc: "superfamily variable", cssVar: "var(--font-roboto-flex)" },
  { value: "roboto-mono", label: "Roboto Mono", desc: "classic monospace", cssVar: "var(--font-roboto-mono)" },
  { value: "source-code-pro", label: "Source Code Pro", desc: "adobe monospace", cssVar: "var(--font-source-code-pro)" },
  { value: "space-grotesk", label: "Space Grotesk", desc: "techy geometric", cssVar: "var(--font-space-grotesk)" },
  { value: "space-mono", label: "Space Mono", desc: "geometric mono", cssVar: "var(--font-space-mono)" },
  { value: "titillium-web", label: "Titillium Web", desc: "accented sans", cssVar: "var(--font-titillium-web)" },
  { value: "ubuntu-mono", label: "Ubuntu Mono", desc: "ubuntu mono", cssVar: "var(--font-ubuntu-mono)" },
  { value: "victor-mono", label: "Victor Mono", desc: "cursive mono", cssVar: "var(--font-victor-mono)" },
  { value: "work-sans", label: "Work Sans", desc: "clean modern sans", cssVar: "var(--font-work-sans)" },
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

  // Custom fuzzy filter for better search results
  const fuzzyFilter = (value: string, search: string) => {
    if (!search) return 1;
    const lowerValue = value.toLowerCase();
    const lowerSearch = search.toLowerCase();
    
    // Exact match gets highest score
    if (lowerValue.includes(lowerSearch)) return 1;
    
    // Fuzzy match: check if all search chars appear in order
    let searchIdx = 0;
    for (let i = 0; i < lowerValue.length && searchIdx < lowerSearch.length; i++) {
      if (lowerValue[i] === lowerSearch[searchIdx]) searchIdx++;
    }
    if (searchIdx === lowerSearch.length) return 0.8;
    
    // Partial match: at least some chars match
    let matchCount = 0;
    for (const char of lowerSearch) {
      if (lowerValue.includes(char)) matchCount++;
    }
    return matchCount / lowerSearch.length > 0.5 ? 0.5 : 0;
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl max-h-[80vh]" filter={fuzzyFilter} data-command-overlay="">
      <CommandInput placeholder="search users, settings, or commands…" onValueChange={setUserQuery} />
      <CommandList>
        <CommandEmpty>no matching command</CommandEmpty>

        {/* User search results — always shown when there's a query */}
        {userQuery.trim().length > 0 && (
          <CommandGroup heading="users" forceMount>
            {userLoading && (
              <CommandItem disabled value="users searching">
                <IconSearch className="size-4 opacity-50" />
                <span className="text-muted-foreground">searching users…</span>
              </CommandItem>
            )}
            {!userLoading && userResults.length === 0 && (
              <CommandItem disabled value="users no results">
                <IconUser className="size-4 opacity-50" />
                <span className="text-muted-foreground">no users found</span>
              </CommandItem>
            )}
            {userResults.map((u) => (
              <CommandItem
                key={u.userId}
                value={`users ${u.username} view profile`}
                keywords={["users", u.username]}
                onSelect={() => go(`/profile/${u.username}`)}
              >
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
          <CommandItem value="navigate test alt+1" keywords={["navigate", "test"]} onSelect={() => go("/")}><IconKeyboardFilled /> test<Shortcut>alt+1</Shortcut></CommandItem>
          <CommandItem value="navigate leaderboard global bests alt+2" keywords={["navigate", "leaderboard"]} onSelect={() => go("/leaderboard")}><IconSparkles /> leaderboard<Shortcut>alt+2</Shortcut></CommandItem>
          <CommandItem value="navigate profile dashboard alt+3" keywords={["navigate", "profile"]} onSelect={() => go("/profile")}><IconLayoutDashboard /> profile<Shortcut>alt+3</Shortcut></CommandItem>
          <CommandItem value="navigate settings config alt+4" keywords={["navigate", "settings"]} onSelect={() => go("/settings")}><IconSettings /> settings<Shortcut>alt+4</Shortcut></CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="actions">
          <CommandItem value="actions restart test tab" keywords={["actions", "restart"]} onSelect={() => { close(); window.dispatchEvent(new CustomEvent("zt:restart")); }}>
            <IconRefresh /> restart test<Shortcut>tab</Shortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="mode">
          {TIME_OPTIONS.map((t) => (
            <CommandItem
              key={`time-${t}`}
              value={`mode time ${t}s type for ${t} seconds`}
              keywords={["mode", "time"]}
              onSelect={() => { update({ mode: "time", duration: t }); close(); }} className={active(settings.mode === "time" && settings.duration === t)}>
              <IconClock /> {t}s — time<CommandDesc>type for {t} seconds</CommandDesc>
            </CommandItem>
          ))}
          {WORD_OPTIONS.map((w) => (
            <CommandItem
              key={`words-${w}`}
              value={`mode words ${w}w type ${w} words`}
              keywords={["mode", "words"]}
              onSelect={() => { update({ mode: "words", wordCount: w }); close(); }} className={active(settings.mode === "words" && settings.wordCount === w)}>
              <IconLetterT /> {w}w — words<CommandDesc>type {w} words</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="theme">
          {THEMES.map((t) => (
            <CommandItem
              key={t.id}
              value={`theme appearance ${t.label} ${t.appearance} ${t.id}`}
              keywords={["theme", "appearance", t.label, t.appearance]}
              onSelect={() => { update({ themeId: t.id }); close(); }} className={active(settings.themeId === t.id)}>
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
          <CommandItem
            value="sound audio keystroke click thock beep enable disable"
            keywords={["sound", "audio"]}
            onSelect={() => update({ sound: { ...settings.sound, enabled: !settings.sound.enabled } })}
          >
            {settings.sound.enabled ? <IconVolume /> : <IconVolumeOff />}
            sound {settings.sound.enabled ? "on" : "off"}<CommandDesc>enable or disable keystroke audio feedback</CommandDesc>
          </CommandItem>
          <CommandItem
            value="sound error beep incorrect character"
            keywords={["sound", "error"]}
            onSelect={() => update({ soundOnError: !settings.soundOnError })}
          >
            <IconBlender /> error sound {settings.soundOnError ? "on" : "off"}<CommandDesc>play a sound when you type an incorrect character</CommandDesc>
          </CommandItem>
          {SOUND_VARIANTS.map((v) => (
            <CommandItem
              key={v.value}
              value={`sound audio variant ${v.label} ${v.desc}`}
              keywords={["sound", v.label]}
              onSelect={() => { update({ sound: { ...settings.sound, variant: v.value } }); playKeypress(v.value, settings.sound.volume); }} className={active(settings.sound.variant === v.value)}>
              <IconPlayerPlay /> {v.label}<CommandDesc>{v.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="caret">
          {CARET_STYLES.map((c) => (
            <CommandItem
              key={c.value}
              value={`caret cursor ${c.label} ${c.desc}`}
              keywords={["caret", c.label]}
              onSelect={() => { update({ caretStyle: c.value }); close(); }} className={active(settings.caretStyle === c.value)}>
              <IconTypography /> {c.label}<CommandDesc>{c.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font size">
          {FONT_SIZES.map((f) => (
            <CommandItem
              key={f.value}
              value={`font size ${f.label} ${f.desc} text`}
              keywords={["font", "size", f.label]}
              onSelect={() => { update({ fontSize: f.value }); close(); }} className={active(settings.fontSize === f.value)}>
              <IconDeviceDesktop /> {f.label}<CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="font family">
          {FONT_FAMILIES.map((f) => (
            <CommandItem
              key={f.value}
              value={`font family ${f.label} ${f.desc} typeface`}
              keywords={["font", "family", f.label]}
              onSelect={() => { update({ fontFamily: f.value }); close(); }} className={active(settings.fontFamily === f.value)}>
              <IconTypography />
              <span style={{ fontFamily: f.cssVar }}>{f.label}</span>
              <CommandDesc>{f.desc}</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="visible lines">
          {([1, 2, 3] as const).map((n) => (
            <CommandItem
              key={n}
              value={`visible lines ${n} line show text`}
              keywords={["visible", "lines"]}
              onSelect={() => { update({ visibleLines: n }); close(); }} className={active(settings.visibleLines === n)}>
              <IconList /> {n} line{n > 1 ? "s" : ""}<CommandDesc>show {n} line{n > 1 ? "s" : ""} of text at a time</CommandDesc>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="gameplay">
          <CommandItem
            value="gameplay blind mode hide error coloring trust fingers"
            keywords={["gameplay", "blind"]}
            onSelect={() => update({ blindMode: !settings.blindMode })}
          >
            {settings.blindMode ? <IconEyeOff /> : <IconEye />}
            blind mode {settings.blindMode ? "on" : "off"}<CommandDesc>hide error coloring</CommandDesc>
          </CommandItem>
          <CommandItem
            value="gameplay stop on error block cursor until fixed"
            keywords={["gameplay", "stop"]}
            onSelect={() => update({ stopOnError: !settings.stopOnError })}
          >
            <IconBlender /> stop on error {settings.stopOnError ? "on" : "off"}<CommandDesc>block cursor until fixed</CommandDesc>
          </CommandItem>
          <CommandItem
            value="gameplay strict space wrong words cannot be skipped"
            keywords={["gameplay", "strict"]}
            onSelect={() => update({ strictSpace: !settings.strictSpace })}
          >
            <IconBlender /> strict space {settings.strictSpace ? "on" : "off"}<CommandDesc>wrong words can't be skipped</CommandDesc>
          </CommandItem>
          <CommandItem
            value="gameplay free backspace restore previous word"
            keywords={["gameplay", "backspace"]}
            onSelect={() => update({ freeBackspace: !settings.freeBackspace })}
          >
            <IconRefresh /> free backspace {settings.freeBackspace ? "on" : "off"}<CommandDesc>restore previous word on backspace</CommandDesc>
          </CommandItem>
          <CommandItem
            value="gameplay hide live stats blank wpm acc while running"
            keywords={["gameplay", "live", "stats"]}
            onSelect={() => update({ hideLiveStats: !settings.hideLiveStats })}
          >
            <IconEyeOff /> hide live stats {settings.hideLiveStats ? "on" : "off"}<CommandDesc>blank wpm/acc while running</CommandDesc>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="appearance">
          <CommandItem
            value="appearance virtual keyboard show key highlighter"
            keywords={["appearance", "keyboard"]}
            onSelect={() => update({ showKeyboard: !settings.showKeyboard })}
          >
            <IconKeyboardFilled /> virtual keyboard {settings.showKeyboard ? "on" : "off"}<CommandDesc>show key highlighter</CommandDesc>
          </CommandItem>
          <CommandItem
            value="appearance smooth caret animate caret movement"
            keywords={["appearance", "caret"]}
            onSelect={() => update({ smoothCaret: !settings.smoothCaret })}
          >
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
