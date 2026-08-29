"use client";

import * as React from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "~/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

export interface ComboboxItem {
  value: string;
  label: string;
  /** Optional element to render before the label */
  leading?: React.ReactNode;
  /** Optional CSS font-family variable for rendering the label in its own font */
  fontCssVar?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((i) => i.value === value);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Scroll to selected item when popover opens
  React.useEffect(() => {
    if (open && listRef.current) {
      // Small delay to let the list render
      const timer = setTimeout(() => {
        const selectedItem = listRef.current?.querySelector('[data-selected="true"]');
        if (selectedItem) {
          selectedItem.scrollIntoView({ block: "nearest" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-input flex h-8 w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className,
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.leading}
              {selected.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconChevronDown className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList ref={listRef}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                data-selected={value === item.value ? "true" : undefined}
                onSelect={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
              >
                <span className="flex flex-1 items-center gap-2">
                  {item.leading}
                  <span style={item.fontCssVar ? { fontFamily: item.fontCssVar } : undefined}>{item.label}</span>
                </span>
                {value === item.value && (
                  <IconCheck className="size-4 shrink-0" />
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
