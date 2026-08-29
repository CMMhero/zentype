import { create } from "zustand";

interface UiState {
  paletteOpen: boolean;
  helpOpen: boolean;
  isTestRunning: boolean;
  setPaletteOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setTestRunning: (running: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  helpOpen: false,
  isTestRunning: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setTestRunning: (isTestRunning) => set({ isTestRunning }),
}));

export function dispatchRestart() {
  window.dispatchEvent(new CustomEvent("zt:restart"));
}
