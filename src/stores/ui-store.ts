import { create } from "zustand";

interface UiState {
  paletteOpen: boolean;
  helpOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  helpOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
}));

export function dispatchRestart() {
  window.dispatchEvent(new CustomEvent("zt:restart"));
}
