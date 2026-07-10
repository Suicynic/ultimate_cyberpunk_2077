"use client";

import * as React from "react";
import { CharacterCard } from "@/app/characters/CharacterCard";
import {
  CharacterFilters,
  SEARCH_MAX,
  type CategoryFilter,
  type ImportanceFilter,
  type RelationshipFilter,
  type ScopeFilter,
  type SortKey,
} from "@/app/characters/CharacterFilters";
import { EmptyState, PageHeader } from "@/components/ui";
import { characters } from "@/data/characters";
import { factions } from "@/data/factions";
import { useSettings } from "@/lib/hooks";
import type { CharacterDef, CharacterImportance } from "@/types/domain";

const IMPORTANCE_ORDER: Record<CharacterImportance, number> = {
  primary: 0,
  major: 1,
  supporting: 2,
};

/** Spoiler-safe haystack — never includes shielded biography text. */
function matchesQuery(c: CharacterDef, q: string): boolean {
  if (!q) return true;
  const haystack = [c.name, c.role, ...(c.aliases ?? []), ...c.affiliations, ...c.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function CharacterArchive() {
  const settings = useSettings();

  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<ScopeFilter>("all");
  const [importance, setImportance] = React.useState<ImportanceFilter>("all");
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [faction, setFaction] = React.useState<string>("all");
  const [relationship, setRelationship] = React.useState<RelationshipFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("name");

  const q = query.trim().toLowerCase().slice(0, SEARCH_MAX);

  const visible = characters
    .filter((c) => {
      if (scope === "base") return c.gameScope === "base_game" || c.gameScope === "both";
      if (scope === "phantom_liberty")
        return c.gameScope === "phantom_liberty" || c.gameScope === "both";
      return true;
    })
    .filter((c) => importance === "all" || c.importance === importance)
    .filter((c) => category === "all" || c.category === category)
    .filter((c) => faction === "all" || (c.relatedFactionIds?.includes(faction) ?? false))
    .filter((c) => relationship === "all" || (c.relationshipTypes?.includes(relationship) ?? false))
    .filter((c) => matchesQuery(c, q))
    .sort((a, b) => {
      if (sort === "importance") {
        const d = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance];
        return d !== 0 ? d : a.name.localeCompare(b.name);
      }
      if (sort === "affiliation") {
        const d = (a.affiliations[0] ?? "").localeCompare(b.affiliations[0] ?? "");
        return d !== 0 ? d : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <PageHeader
        readout={`// nc personnel archive · ${characters.length} records (starter set)`}
        title={settings.conventionalLabels ? "Characters" : "Character Database"}
        description="People, factions, and relationships encountered across Night City and Dogtown. Names are spoiler-safe; fates and twists stay behind the shield until you reveal them."
      />

      <CharacterFilters
        query={query}
        onQuery={setQuery}
        scope={scope}
        onScope={setScope}
        importance={importance}
        onImportance={setImportance}
        category={category}
        onCategory={setCategory}
        faction={faction}
        onFaction={setFaction}
        relationship={relationship}
        onRelationship={setRelationship}
        sort={sort}
        onSort={setSort}
        factions={factions}
      />

      <h2 className="readout mb-3 !text-ink-dim" aria-live="polite">
        {visible.length} {visible.length === 1 ? "record" : "records"} on file
      </h2>

      {visible.length === 0 ? (
        <EmptyState
          title="No personnel match the current filters"
          body="Try clearing a filter or searching a different name, alias, role or affiliation."
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => (
            <li key={c.id} className="flex">
              <div className="w-full">
                <CharacterCard character={c} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
