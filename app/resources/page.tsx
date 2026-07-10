"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge, Input, PageHeader, Panel, Select, type Tone } from "@/components/ui";
import { resources } from "@/data/resources";
import { useSettings } from "@/lib/hooks";
import type { ResourceCategory, ResourceTrust } from "@/types/domain";

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  official: "Official",
  wiki: "Wikis",
  build_guide: "Build guides",
  map: "Maps",
  achievement_guide: "Achievement guides",
  modding: "Modding",
  accessibility: "Accessibility",
  performance: "Performance",
  lore: "Lore",
  community_tool: "Community tools",
  video: "Video",
  save_management: "Save management",
};

const TRUST_TONE: Record<ResourceTrust, Tone> = {
  official: "lime",
  community: "holo",
  speculative: "amber",
};

export default function ResourcesPage() {
  return (
    <React.Suspense fallback={null}>
      <ResourcesPageInner />
    </React.Suspense>
  );
}

function ResourcesPageInner() {
  const settings = useSettings();
  const params = useSearchParams();
  const focusId = params.get("focus");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ResourceCategory | "all">("all");

  const visible = resources
    .filter((r) => category === "all" || r.category === category)
    .filter(
      (r) =>
        !query.trim() ||
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.publisher.toLowerCase().includes(query.toLowerCase()) ||
        r.summary.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <>
      <PageHeader
        readout={`// archive · ${resources.length} curated links`}
        title={settings.conventionalLabels ? "Resources" : "Archive"}
        description="A curated directory, not a content mirror. Every link stays the property of its publisher; link health is checked by an automated script."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="res-search" className="sr-only">
          Search resources
        </label>
        <Input
          id="res-search"
          type="search"
          placeholder="Search resources…"
          className="!w-full sm:!w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label htmlFor="res-cat" className="sr-only">
          Filter by category
        </label>
        <Select
          id="res-cat"
          className="!w-auto"
          value={category}
          onChange={(e) => setCategory(e.target.value as ResourceCategory | "all")}
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((r) => (
          <Panel
            key={r.id}
            as="article"
            className={focusId === r.id ? "!border-holo" : undefined}
            readout={`// ${CATEGORY_LABEL[r.category].toLowerCase()}${r.lastChecked ? ` · checked ${r.lastChecked}` : ""}`}
            title={
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-holo">
                {r.title} <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in new tab)</span>
              </a>
            }
            actions={<Badge tone={TRUST_TONE[r.trust]}>{r.trust}</Badge>}
          >
            <p className="mb-2 text-sm text-ink-dim">{r.summary}</p>
            <p className="text-xs text-ink-faint">
              {r.publisher}
              {r.gameVersion ? ` · game v${r.gameVersion}` : ""}
            </p>
          </Panel>
        ))}
      </div>

      <Panel readout="// legal" title="Disclaimer" className="mt-6">
        <div className="space-y-2 text-sm text-ink-dim">
          <p>
            Ultimate Cyberpunk 2077 is an unofficial, community-built fan project. It is not
            affiliated with, endorsed by, or sponsored by CD Projekt Red. Cyberpunk 2077, Phantom
            Liberty, and all related marks and materials are the property of their respective
            owners.
          </p>
          <p>
            This project does not distribute game files and does not reproduce paid guide content.
            Facts are summarized in original wording with links to their sources; external resources
            remain the property of their respective publishers.
          </p>
          <p>
            Copyright holders can request removal or attribution changes by opening an issue on the
            project repository (see the README for the process).
          </p>
        </div>
      </Panel>
    </>
  );
}
