import type { SourceRef } from "@/types/domain";

/**
 * Shared source references used across the starter dataset.
 *
 * Rules (see DATA_SOURCES.md):
 *  - Facts are summarized in original wording and linked to their source.
 *  - No article, wiki, or guide text is copied.
 *  - Every canonical record carries at least one source.
 */

export const ACCESSED = "2026-07-10";

export const SRC_OFFICIAL_SITE: SourceRef = {
  title: "Cyberpunk 2077 — official site",
  url: "https://www.cyberpunk.net/",
  publisher: "CD Projekt Red",
  accessedAt: ACCESSED,
};

export const SRC_OFFICIAL_NEWS: SourceRef = {
  title: "Cyberpunk 2077 news & patch notes",
  url: "https://www.cyberpunk.net/en/news",
  publisher: "CD Projekt Red",
  accessedAt: ACCESSED,
};

export const SRC_WIKI = (page: string, title: string): SourceRef => ({
  title: `Cyberpunk Wiki — ${title}`,
  url: `https://cyberpunk.fandom.com/wiki/${page}`,
  publisher: "Fandom (community)",
  accessedAt: ACCESSED,
});

export const SRC_STEAM_ACHIEVEMENTS: SourceRef = {
  title: "Cyberpunk 2077 achievements on Steam",
  url: "https://steamcommunity.com/stats/1091500/achievements",
  publisher: "Valve / Steam community hub",
  accessedAt: ACCESSED,
};

export const SRC_POWERPYX: SourceRef = {
  title: "Cyberpunk 2077 Trophy Guide & Roadmap",
  url: "https://www.powerpyx.com/cyberpunk-2077-trophy-guide-roadmap/",
  publisher: "PowerPyx",
  accessedAt: ACCESSED,
};
