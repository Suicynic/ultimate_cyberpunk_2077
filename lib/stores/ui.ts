"use client";

import { create } from "zustand";

/** Ephemeral UI state (never persisted). */
interface UiState {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** Spoilers revealed for this session only (before the user persists). */
  sessionReveals: Set<string>;
  revealForSession: (key: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  sessionReveals: new Set<string>(),
  revealForSession: (key) =>
    set((s) => {
      const next = new Set(s.sessionReveals);
      next.add(key);
      return { sessionReveals: next };
    }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
