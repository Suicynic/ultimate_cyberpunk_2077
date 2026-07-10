import type { SpoilerLevel, SpoilerMode } from "@/types/domain";

/**
 * Spoiler shield rules — pure and unit-tested.
 *
 * Modes:
 *  - hide_all:   anything above "none" is shielded
 *  - hide_major: "minor" shows, "major"/"endgame" are shielded
 *  - show_all:   nothing is shielded
 *
 * Individual records can additionally be revealed on demand; reveals are
 * persisted so a user's choices survive refreshes.
 */
export function isShielded(
  level: SpoilerLevel,
  mode: SpoilerMode,
  revealed: readonly string[] = [],
  revealKey?: string,
): boolean {
  if (revealKey && revealed.includes(revealKey)) return false;
  switch (mode) {
    case "show_all":
      return false;
    case "hide_all":
      return level !== "none";
    case "hide_major":
      return level === "major" || level === "endgame";
  }
}

export const SPOILER_LEVEL_LABEL: Record<SpoilerLevel, string> = {
  none: "Spoiler-free",
  minor: "Minor spoilers",
  major: "Major spoilers",
  endgame: "Endgame spoilers",
};

export const SPOILER_MODE_LABEL: Record<SpoilerMode, string> = {
  hide_all: "Shield everything",
  hide_major: "Shield major & endgame",
  show_all: "Show everything",
};
