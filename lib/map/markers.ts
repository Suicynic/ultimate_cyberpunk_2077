import type { CustomMarker, District, MapMarkerDef, MarkerCategory } from "@/types/domain";

/**
 * Leaflet-free marker vocabulary shared by the map, the legend and tests.
 *
 * Keeping this module free of any `leaflet` import means the legend, filter
 * summary and unit tests can consume the marker visual language without pulling
 * Leaflet's CSS through the Tailwind/PostCSS pipeline (which cannot process it
 * under jsdom).
 *
 * Category is communicated by THREE redundant channels so the map never relies
 * on colour alone (WCAG 1.4.1): a hue, a distinct glyph, and the text label.
 */

/** A marker as prepared for display: canonical or custom, with per-run state. */
export interface DisplayMarker {
  id: string;
  name: string;
  category: MarkerCategory;
  x: number;
  y: number;
  district: District;
  shielded: boolean;
  completed: boolean;
  discovered: boolean;
  isCustom: boolean;
  def?: MapMarkerDef;
  custom?: CustomMarker;
}

/** Neutral hue for shielded markers and unknown categories. */
export const NEUTRAL_COLOR = "#9fb0c8";

/** Hue for shielded markers (deliberately desaturated, distinct from vendor). */
export const SHIELDED_COLOR = "#64748f";

export const CATEGORY_COLORS: Record<MarkerCategory, string> = {
  fast_travel: "#58e6d9",
  main_job: "#ff5d7a",
  side_job: "#ffc857",
  gig: "#a3e635",
  ncpd: "#7dd3fc",
  cyberpsycho: "#ff5d7a",
  tarot_card: "#a78bfa",
  relic_terminal: "#22d3ee",
  iconic_weapon: "#fb923c",
  vehicle: "#94a3b8",
  apartment: "#ffc857",
  vendor: "#9fb0c8",
  ripperdoc: "#a3e635",
  hidden: "#a78bfa",
  easter_egg: "#e879f9",
  custom: "#e8eef7",
};

/**
 * A distinct glyph per category. Rendered decoratively (aria-hidden); the
 * accessible name always carries the full category + place text. Chosen from
 * widely-supported geometric/symbolic code points so no icon font is needed.
 */
export const CATEGORY_GLYPH: Record<MarkerCategory, string> = {
  fast_travel: "◈",
  main_job: "◉",
  side_job: "○",
  gig: "◇",
  ncpd: "▲",
  cyberpsycho: "✖",
  tarot_card: "✦",
  relic_terminal: "⬡",
  iconic_weapon: "✷",
  vehicle: "⬢",
  apartment: "⌂",
  vendor: "▣",
  ripperdoc: "✚",
  hidden: "?",
  easter_egg: "★",
  custom: "◆",
};

/**
 * Categories shown in the legend, in a stable reading order. Only the ones that
 * actually appear in the current marker set are rendered (see MapLegend).
 */
export const LEGEND_CATEGORY_ORDER: MarkerCategory[] = [
  "fast_travel",
  "vendor",
  "ripperdoc",
  "apartment",
  "tarot_card",
  "iconic_weapon",
  "cyberpsycho",
  "easter_egg",
  "main_job",
  "side_job",
  "gig",
  "ncpd",
  "relic_terminal",
  "vehicle",
  "hidden",
  "custom",
];

/** Resolve the display hue for a marker, accounting for the spoiler shield. */
export function markerColor(m: Pick<DisplayMarker, "category" | "shielded">): string {
  if (m.shielded) return SHIELDED_COLOR;
  return CATEGORY_COLORS[m.category] ?? NEUTRAL_COLOR;
}
