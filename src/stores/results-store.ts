import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TestResult } from "~/lib/types";

interface ResultsState {
  /** guest results awaiting cloud sync */
  local: TestResult[];
  addLocal: (r: TestResult) => void;
  removeLocal: (id: string) => void;
  clearLocal: () => void;
}

export const useResultsStore = create<ResultsState>()(
  persist(
    (set) => ({
      local: [],
      addLocal: (r) =>
        set((s) => ({ local: [r, ...s.local].slice(0, 200) })),
      removeLocal: (id) =>
        set((s) => ({ local: s.local.filter((x) => x.id !== id) })),
      clearLocal: () => set({ local: [] }),
    }),
    { name: "zentype-local-results", version: 1 },
  ),
);
