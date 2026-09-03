"use client";

import { IconDevices, IconMoon, IconSearch, IconSun } from "@tabler/icons-react";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PillButton, PillGroup } from "~/components/ui/pill-toggle";
import type { ThemePalette } from "~/lib/themes";
import { cn } from "~/lib/utils";

type Filter = "all" | "light" | "dark";

interface ThemePickerProps {
  themes: ThemePalette[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ThemePicker({ themes, selectedId, onSelect }: ThemePickerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () => [...themes].sort((a, b) => a.label.localeCompare(b.label)),
    [themes],
  );

  const fuse = useMemo(
    () =>
      new Fuse(sorted, {
        keys: ["label"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [sorted],
  );

  const filtered = useMemo(() => {
    let list = sorted;
    if (search.trim()) {
      list = fuse.search(search).map((r) => r.item);
    }
    if (filter !== "all") {
      list = list.filter((t) => t.appearance === filter);
    }
    return list;
  }, [sorted, fuse, search, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <IconSearch className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search themes…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <PillGroup
          className="shrink-0"
          value={[filter]}
          onValueChange={(v) => {
            const next = v[0];
            if (next) setFilter(next as Filter);
          }}
        >
          <PillButton value="all">
            <IconDevices className="size-3.5" />
          </PillButton>
          <PillButton value="light">
            <IconSun className="size-3.5" />
          </PillButton>
          <PillButton value="dark">
            <IconMoon className="size-3.5" />
          </PillButton>
        </PillGroup>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant="outline"
            onClick={() => onSelect(t.id)}
            className={cn(
              "h-auto w-full min-w-0 justify-start gap-2 rounded-2xl bg-transparent p-2 text-left font-medium shadow-none hover:bg-transparent",
              selectedId === t.id ? "border-primary ring-ring/40 ring-1" : "hover:border-primary",
            )}
          >
            <span className="flex shrink-0 overflow-hidden rounded-sm border border-black/20">
              <span className="size-5" style={{ background: t.vars["--background"] }} />
              <span className="size-5" style={{ background: t.vars["--primary"] }} />
              <span className="size-5" style={{ background: t.vars["--secondary"] }} />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs">{t.label}</span>
          </Button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">no themes match</p>
      )}
    </div>
  );
}
