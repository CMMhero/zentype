import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID } from "~/lib/themes";
import type { GameSettings } from "~/lib/types";

const DEFAULT_SETTINGS: GameSettings = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  source: "words",
  blindMode: false,
  stopOnError: false,
  strictSpace: false,
  freeBackspace: true,
  sound: { enabled: false, volume: 0.5, variant: "click" },
  soundOnError: false,
  themeId: DEFAULT_THEME_ID,
  caretStyle: "block",
  smoothCaret: true,
  fontSize: "lg",
  fontFamily: "stack-sans-text",
  showKeyboard: true,
  visibleLines: 3,
  hideLiveStats: false,
  hideProgress: false,
  punctuation: false,
  numbers: false,
};

interface SettingsState {
  settings: GameSettings;
  /** True once persisted settings have been rehydrated from storage */
  hasHydrated: boolean;
  update: (patch: Partial<GameSettings>) => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      hasHydrated: false,
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "zentype-settings",
      version: 5,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState) => {
        // persistedState may be { settings: {...} } or legacy flat shape
        const raw = (persistedState ?? {}) as Record<string, unknown>;
        const p =
          (raw.settings as Partial<GameSettings> | undefined) ?? (raw as Partial<GameSettings>);
        const legacy = p as Partial<GameSettings> & { soundVolume?: number; settings?: unknown };
        // unwrap nested settings if previous buggy migration stored { settings: { settings: {...} } }
        const actual = (
          legacy.settings && typeof legacy.settings === "object" && !Array.isArray(legacy.settings)
            ? (legacy.settings as Partial<GameSettings>)
            : p
        ) as Partial<GameSettings> & { soundVolume?: number };
        return {
          settings: {
            ...DEFAULT_SETTINGS,
            ...actual,
            sound: {
              ...DEFAULT_SETTINGS.sound,
              ...(actual.sound ?? {}),
              volume: actual.sound?.volume ?? legacy.soundVolume ?? DEFAULT_SETTINGS.sound.volume,
            },
          },
        } as SettingsState;
      },
    },
  ),
);

export const DEFAULTS = DEFAULT_SETTINGS;
