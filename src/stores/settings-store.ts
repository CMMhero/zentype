import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameSettings } from "~/lib/types";
import { DEFAULT_THEME_ID } from "~/lib/themes";

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
  soundOnError: true,
  themeId: DEFAULT_THEME_ID,
  caretStyle: "block",
  smoothCaret: true,
  fontSize: "lg",
  fontFamily: "geist-mono",
  showKeyboard: false,
  visibleLines: 3,
  hideLiveStats: false,
};

interface SettingsState {
  settings: GameSettings;
  update: (patch: Partial<GameSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "zentype-settings",
      version: 3,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<GameSettings> & {
          soundVolume?: number;
        };
        return {
          settings: {
            ...DEFAULT_SETTINGS,
            ...p,
            sound: {
              ...DEFAULT_SETTINGS.sound,
              ...(p.sound ?? {}),
              volume: p.sound?.volume ?? p.soundVolume ?? DEFAULT_SETTINGS.sound.volume,
            },
          },
        } as SettingsState;
      },
    },
  ),
);

export const DEFAULTS = DEFAULT_SETTINGS;
