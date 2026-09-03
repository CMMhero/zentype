"use client";

import { IconCode } from "@tabler/icons-react";
import Link from "next/link";
import { ComboboxSelect, type ComboboxSelectOption } from "~/components/ui/combobox";
import { SelectSkeleton } from "~/components/ui/skeleton";
import { TextLink } from "~/components/ui/text-link";
import { FONTS } from "~/lib/fonts";
import { THEMES } from "~/lib/themes";
import type { FontFamily } from "~/lib/types";
import { useSettingsStore } from "~/stores/settings-store";

const THEME_FOOTER_ITEMS: ComboboxSelectOption[] = [...THEMES]
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((t) => ({
    value: t.id,
    label: t.label,
    leading: (
      <span className="flex shrink-0 gap-0.5">
        <span
          className="size-3 rounded-sm border border-border/50"
          style={{ background: t.vars["--background"] }}
        />
        <span className="size-3 rounded-sm" style={{ background: t.vars["--primary"] }} />
        <span className="size-3 rounded-sm" style={{ background: t.vars["--secondary"] }} />
      </span>
    ),
  }));

const FONT_FOOTER_ITEMS: ComboboxSelectOption[] = FONTS.map((f) => ({
  value: f.value,
  label: f.label,
  fontCssVar: f.cssVar,
}));

export function Footer() {
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const fontFamily = useSettingsStore((s) => s.settings.fontFamily);
  const settingsHydrated = useSettingsStore((s) => s.hasHydrated);
  const updateSettings = useSettingsStore((s) => s.update);

  return (
    <footer className="text-muted-foreground mt-auto shrink-0" role="contentinfo">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 sm:justify-start">
        <span className="flex items-center gap-2 text-xs">
          <Link
            href="https://github.com/CMMhero/zentype"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
            aria-label="GitHub"
          >
            <IconCode className="size-4 text-primary" />
          </Link>
          <TextLink href="/about" className="text-xs">
            about
          </TextLink>
          <TextLink href="/terms" className="text-xs">
            terms
          </TextLink>
          <TextLink href="/privacy" className="text-xs">
            privacy
          </TextLink>
        </span>
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          {settingsHydrated ? (
            <>
              <ComboboxSelect
                items={THEME_FOOTER_ITEMS}
                value={themeId}
                onValueChange={(v) => updateSettings({ themeId: v })}
                placeholder="theme"
                searchPlaceholder="search themes…"
                className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
              />
              <ComboboxSelect
                items={FONT_FOOTER_ITEMS}
                value={fontFamily}
                onValueChange={(v) => updateSettings({ fontFamily: v as FontFamily })}
                placeholder="font"
                searchPlaceholder="search fonts…"
                className="h-7 border-0 bg-transparent shadow-none hover:bg-muted px-2 text-[11px]"
              />
            </>
          ) : (
            <>
              {/* Settings not loaded yet — don't show the default theme/font */}
              <SelectSkeleton className="h-7 w-16 px-2" />
              <SelectSkeleton className="h-7 w-14 px-2" />
            </>
          )}
        </span>
      </div>
    </footer>
  );
}
