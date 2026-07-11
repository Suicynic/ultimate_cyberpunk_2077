"use client";

import { Input, Select } from "@/components/ui";
import {
  CHARACTER_CATEGORY_LABEL,
  CHARACTER_IMPORTANCE_LABEL,
  CHARACTER_RELATIONSHIP_TYPE_LABEL,
} from "@/lib/labels";
import type {
  CharacterCategory,
  CharacterImportance,
  CharacterRelationshipType,
  FactionDef,
} from "@/types/domain";

export type ScopeFilter = "all" | "base" | "phantom_liberty";
export type ImportanceFilter = "all" | CharacterImportance;
export type CategoryFilter = "all" | CharacterCategory;
export type RelationshipFilter = "all" | CharacterRelationshipType;
export type SortKey = "name" | "importance" | "affiliation";

/** Max characters accepted from the search box (input normalization/cap). */
export const SEARCH_MAX = 64;

const CATEGORY_CHIPS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.entries(CHARACTER_CATEGORY_LABEL) as [CharacterCategory, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

export function CharacterFilters({
  query,
  onQuery,
  scope,
  onScope,
  importance,
  onImportance,
  category,
  onCategory,
  faction,
  onFaction,
  relationship,
  onRelationship,
  sort,
  onSort,
  factions,
}: {
  query: string;
  onQuery: (v: string) => void;
  scope: ScopeFilter;
  onScope: (v: ScopeFilter) => void;
  importance: ImportanceFilter;
  onImportance: (v: ImportanceFilter) => void;
  category: CategoryFilter;
  onCategory: (v: CategoryFilter) => void;
  faction: string;
  onFaction: (v: string) => void;
  relationship: RelationshipFilter;
  onRelationship: (v: RelationshipFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  factions: FactionDef[];
}) {
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72">
          <label htmlFor="character-search" className="sr-only">
            Search characters by name, alias, role, affiliation or tag
          </label>
          <Input
            id="character-search"
            type="search"
            placeholder="Search personnel…"
            value={query}
            maxLength={SEARCH_MAX}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>

        <label htmlFor="character-scope" className="sr-only">
          Filter by release
        </label>
        <Select
          id="character-scope"
          className="!w-auto"
          value={scope}
          onChange={(e) => onScope(e.target.value as ScopeFilter)}
        >
          <option value="all">Any release</option>
          <option value="base">Base game</option>
          <option value="phantom_liberty">Phantom Liberty</option>
        </Select>

        <label htmlFor="character-importance" className="sr-only">
          Filter by importance
        </label>
        <Select
          id="character-importance"
          className="!w-auto"
          value={importance}
          onChange={(e) => onImportance(e.target.value as ImportanceFilter)}
        >
          <option value="all">Any importance</option>
          {(Object.entries(CHARACTER_IMPORTANCE_LABEL) as [CharacterImportance, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </Select>

        <label htmlFor="character-faction" className="sr-only">
          Filter by faction
        </label>
        <Select
          id="character-faction"
          className="!w-auto"
          value={faction}
          onChange={(e) => onFaction(e.target.value)}
        >
          <option value="all">Any faction</option>
          {factions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>

        <label htmlFor="character-relationship" className="sr-only">
          Filter by relationship relevance
        </label>
        <Select
          id="character-relationship"
          className="!w-auto"
          value={relationship}
          onChange={(e) => onRelationship(e.target.value as RelationshipFilter)}
        >
          <option value="all">Any relationship</option>
          {(
            Object.entries(CHARACTER_RELATIONSHIP_TYPE_LABEL) as [
              CharacterRelationshipType,
              string,
            ][]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <label htmlFor="character-sort" className="sr-only">
          Sort characters
        </label>
        <Select
          id="character-sort"
          className="!w-auto"
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
        >
          <option value="name">Sort: Name</option>
          <option value="importance">Sort: Importance</option>
          <option value="affiliation">Sort: Affiliation</option>
        </Select>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={category === c.value}
            onClick={() => onCategory(c.value)}
            className={`clip-chip min-h-[36px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
              category === c.value
                ? "border-holo bg-panel-3 text-holo"
                : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
