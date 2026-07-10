"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS } from "@/lib/database/db";
import { useUiStore } from "@/lib/stores/ui";
import type { AppSettings, Playthrough, SpoilerLevel, SpoilerMode } from "@/types/domain";
import { isShielded } from "@/lib/spoilers";

/** Live app settings (reactive to IndexedDB writes). */
export function useSettings(): AppSettings {
  return useLiveQuery(
    async () => (await db.settings.get("app")) ?? DEFAULT_SETTINGS,
    [],
    DEFAULT_SETTINGS,
  );
}

/** All playthroughs, most recently updated first. */
export function usePlaythroughs(): Playthrough[] | undefined {
  return useLiveQuery(() => db.playthroughs.orderBy("updatedAt").reverse().toArray(), []);
}

export function useActivePlaythrough(): {
  playthrough: Playthrough | undefined;
  loading: boolean;
} {
  const result = useLiveQuery(async () => {
    const settings = (await db.settings.get("app")) ?? DEFAULT_SETTINGS;
    if (settings.activePlaythroughId) {
      const found = await db.playthroughs.get(settings.activePlaythroughId);
      if (found) return { playthrough: found };
    }
    // Fall back to a visible (non-archived) run so an archived run is never
    // silently reactivated; only use an archived run if nothing else exists.
    const firstActive = await db.playthroughs.filter((p) => !p.archived).first();
    const first = firstActive ?? (await db.playthroughs.toCollection().first());
    return { playthrough: first };
  }, []);
  return { playthrough: result?.playthrough, loading: result === undefined };
}

/** Effective spoiler mode: per-playthrough override, else global setting. */
export function useSpoilerMode(): SpoilerMode {
  const settings = useSettings();
  const { playthrough } = useActivePlaythrough();
  return playthrough?.spoilerMode ?? settings.spoilerMode;
}

/**
 * Returns a function deciding whether content at a given spoiler level is
 * currently shielded, taking persisted and session reveals into account.
 */
export function useSpoilerGuard(): (level: SpoilerLevel, revealKey?: string) => boolean {
  const mode = useSpoilerMode();
  const settings = useSettings();
  const sessionReveals = useUiStore((s) => s.sessionReveals);
  return (level, revealKey) => {
    if (revealKey && sessionReveals.has(revealKey)) return false;
    return isShielded(level, mode, settings.revealedSpoilers, revealKey);
  };
}
