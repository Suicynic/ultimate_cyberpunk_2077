"use client";

import { Button, Input, Select } from "@/components/ui";
import { DISTRICT_LABEL, MARKER_CATEGORY_LABEL } from "@/lib/labels";
import type { District, MarkerCategory } from "@/types/domain";

export type CategoryFilter = MarkerCategory | "all";
export type DistrictFilter = District | "all";

/** Categories offered in the filter, in reading order (matches the data set). */
export const FILTER_CATEGORIES: CategoryFilter[] = [
  "all",
  "fast_travel",
  "vendor",
  "ripperdoc",
  "apartment",
  "tarot_card",
  "iconic_weapon",
  "cyberpsycho",
  "easter_egg",
  "custom",
];

/**
 * The district-scan filter bar. Controls keep a 44px minimum touch target on
 * mobile and wrap into tidy rows at tablet widths (no orphaned control). The
 * "Clear filters" action only appears while a non-default filter is active.
 */
export function MapFilters({
  query,
  onQuery,
  category,
  onCategory,
  district,
  onDistrict,
  onlyIncomplete,
  onToggleIncomplete,
  onlyUndiscovered,
  onToggleUndiscovered,
  hasActiveFilters,
  onClear,
}: {
  query: string;
  onQuery: (v: string) => void;
  category: CategoryFilter;
  onCategory: (v: CategoryFilter) => void;
  district: DistrictFilter;
  onDistrict: (v: DistrictFilter) => void;
  onlyIncomplete: boolean;
  onToggleIncomplete: () => void;
  onlyUndiscovered: boolean;
  onToggleUndiscovered: () => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <label htmlFor="map-search" className="sr-only">
        Search markers
      </label>
      <Input
        id="map-search"
        type="search"
        placeholder="Search markers…"
        className="!w-full sm:!w-56"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />

      <label htmlFor="map-cat" className="sr-only">
        Category filter
      </label>
      <Select
        id="map-cat"
        className="!w-full sm:!w-auto"
        value={category}
        onChange={(e) => onCategory(e.target.value as CategoryFilter)}
      >
        {FILTER_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All categories" : MARKER_CATEGORY_LABEL[c]}
          </option>
        ))}
      </Select>

      <label htmlFor="map-district" className="sr-only">
        District filter
      </label>
      <Select
        id="map-district"
        className="!w-full sm:!w-auto"
        value={district}
        onChange={(e) => onDistrict(e.target.value as DistrictFilter)}
      >
        <option value="all">All districts</option>
        {Object.entries(DISTRICT_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Button
        size="sm"
        className="!min-h-[44px] flex-1 sm:flex-none"
        aria-pressed={onlyIncomplete}
        onClick={onToggleIncomplete}
      >
        Incomplete only
      </Button>
      <Button
        size="sm"
        className="!min-h-[44px] flex-1 sm:flex-none"
        aria-pressed={onlyUndiscovered}
        onClick={onToggleUndiscovered}
      >
        Undiscovered only
      </Button>

      {hasActiveFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="!min-h-[44px] flex-1 sm:flex-none sm:ml-auto"
          onClick={onClear}
        >
          ✕ Clear filters
        </Button>
      )}
    </div>
  );
}
