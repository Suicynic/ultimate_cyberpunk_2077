"use client";

import {
  CATEGORY_COLORS,
  CATEGORY_GLYPH,
  LEGEND_CATEGORY_ORDER,
  NEUTRAL_COLOR,
} from "@/lib/map/markers";
import { MARKER_CATEGORY_LABEL } from "@/lib/labels";
import type { MarkerCategory } from "@/types/domain";

/**
 * Compact status + legend bar shown beneath the map.
 *
 * - Announces how many signals are currently visible (aria-live) and out of how
 *   many total, plus a concise, spoiler-safe summary of the active filters.
 * - A key mapping the marker glyph/hue vocabulary to category names — only for
 *   the categories actually present, so it never leaks which spoiler-shielded
 *   signals exist beyond their public category.
 */
export function MapLegend({
  visibleCount,
  totalCount,
  categories,
  filterSummary,
}: {
  visibleCount: number;
  totalCount: number;
  /** Categories present in the current visible set, unordered. */
  categories: MarkerCategory[];
  /** Concise, spoiler-safe descriptions of each active filter (may be empty). */
  filterSummary: string[];
}) {
  const present = new Set(categories);
  const legend = LEGEND_CATEGORY_ORDER.filter((c) => present.has(c));

  return (
    <div className="clip-panel mt-3 border border-line bg-panel-2/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="readout !text-ink-dim" aria-live="polite">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "signal" : "signals"}`
            : `${visibleCount} of ${totalCount} signals`}
        </p>
        {filterSummary.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-1" aria-label="Active filters">
            {filterSummary.map((s) => (
              <li
                key={s}
                className="clip-chip border border-line-bright bg-panel-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            No filters
          </span>
        )}
      </div>

      {legend.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line pt-2">
          {legend.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold leading-none"
                style={{
                  color: CATEGORY_COLORS[c] ?? NEUTRAL_COLOR,
                  borderColor: CATEGORY_COLORS[c] ?? NEUTRAL_COLOR,
                }}
              >
                {CATEGORY_GLYPH[c]}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                {MARKER_CATEGORY_LABEL[c]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
