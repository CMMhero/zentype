import type { CaretStyle, FontSizeKey, SoundVariant } from "~/lib/types";

export interface OptionDef<T extends string> {
  value: T;
  label: string;
  desc: string;
}

export const CARET_STYLES: OptionDef<CaretStyle>[] = [
  { value: "line", label: "line", desc: "thin blinking cursor" },
  { value: "block", label: "block", desc: "highlighted character block" },
  { value: "underline", label: "underline", desc: "line under the character" },
  { value: "off", label: "off", desc: "no visible caret" },
];

export const FONT_SIZES: OptionDef<FontSizeKey>[] = [
  { value: "xs", label: "xs", desc: "extra small" },
  { value: "sm", label: "sm", desc: "small" },
  { value: "md", label: "md", desc: "medium" },
  { value: "lg", label: "lg", desc: "large, default" },
  { value: "xl", label: "xl", desc: "extra large" },
  { value: "2xl", label: "2xl", desc: "2x large" },
  { value: "3xl", label: "3xl", desc: "3x large" },
];

export const SOUND_VARIANTS: OptionDef<SoundVariant>[] = [
  { value: "click", label: "click", desc: "sharp mechanical click" },
  { value: "thock", label: "thock", desc: "deep thocky sound" },
  { value: "beep", label: "beep", desc: "soft sine beep" },
];
