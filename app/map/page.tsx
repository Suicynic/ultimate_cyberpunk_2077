"use client";

import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { Badge, Button, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import type { DisplayMarker } from "@/components/map/NightCityMap";
import { mapMarkers } from "@/data/map";
import { db } from "@/lib/database/db";
import { setMarkerProgress } from "@/lib/database/repo";
import { newId, nowIso } from "@/lib/ids";
import { useActivePlaythrough, useSettings, useSpoilerGuard } from "@/lib/hooks";
import { DISTRICT_LABEL, MARKER_CATEGORY_LABEL } from "@/lib/labels";
import type { District, MarkerCategory } from "@/types/domain";

const NightCityMap = dynamic(() => import("@/components/map/NightCityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-faint">
      Booting district scan…
    </div>
  ),
});

const FILTER_CATEGORIES: (MarkerCategory | "all")[] = [
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

export default function MapPage() {
  return (
    <React.Suspense fallback={null}>
      <MapPageInner />
    </React.Suspense>
  );
}

function MapPageInner() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();
  const guard = useSpoilerGuard();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [category, setCategory] = React.useState<MarkerCategory | "all">(
    (params.get("cat") as MarkerCategory | "all") ?? "all",
  );
  const [district, setDistrict] = React.useState<District | "all">(
    (params.get("d") as District | "all") ?? "all",
  );
  const [query, setQuery] = React.useState("");
  const [onlyIncomplete, setOnlyIncomplete] = React.useState(false);
  const [onlyUndiscovered, setOnlyUndiscovered] = React.useState(false);
  const [placing, setPlacing] = React.useState(false);
  const selectedId = params.get("focus");

  const markerProgress = useLiveQuery(
    async () =>
      playthrough ? db.markerProgress.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );
  const customMarkers = useLiveQuery(
    async () =>
      playthrough ? db.customMarkers.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );

  const progressByMarker = new Map((markerProgress ?? []).map((p) => [p.markerId, p]));

  /** Encode filter + focus state in the URL for deep links. */
  const syncUrl = React.useCallback(
    (next: { focus?: string | null; cat?: string; d?: string }) => {
      const sp = new URLSearchParams(params.toString());
      if (next.focus !== undefined) {
        if (next.focus) sp.set("focus", next.focus);
        else sp.delete("focus");
      }
      if (next.cat !== undefined) {
        if (next.cat === "all") sp.delete("cat");
        else sp.set("cat", next.cat);
      }
      if (next.d !== undefined) {
        if (next.d === "all") sp.delete("d");
        else sp.set("d", next.d);
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const displayMarkers: DisplayMarker[] = [
    ...mapMarkers
      .filter((m) => m.expansion === "base" || (playthrough?.hasPhantomLiberty ?? true))
      .map((m): DisplayMarker => {
        const p = progressByMarker.get(m.id);
        return {
          id: m.id,
          name: m.name,
          category: m.category,
          x: m.x,
          y: m.y,
          district: m.district,
          shielded: guard(m.spoilerLevel, m.id),
          completed: p?.completed ?? false,
          discovered: p?.discovered ?? false,
          isCustom: false,
          def: m,
        };
      }),
    ...(customMarkers ?? []).map((c): DisplayMarker => ({
      id: c.id,
      name: c.name,
      category: "custom",
      x: c.x,
      y: c.y,
      district: c.district ?? "watson",
      shielded: false,
      completed: false,
      discovered: true,
      isCustom: true,
      custom: c,
    })),
  ]
    .filter((m) => category === "all" || m.category === category)
    .filter((m) => district === "all" || m.district === district)
    .filter((m) => !onlyIncomplete || !m.completed)
    .filter((m) => !onlyUndiscovered || !m.discovered)
    .filter(
      (m) => !query.trim() || m.shielded || m.name.toLowerCase().includes(query.toLowerCase()),
    );

  const selected = displayMarkers.find((m) => m.id === selectedId) ?? null;

  const addCustomMarker = async (x: number, y: number) => {
    if (!playthrough) return;
    const name = window.prompt("Marker name:");
    if (!name?.trim()) return;
    const marker = {
      id: newId("cmk"),
      playthroughId: playthrough.id,
      name: name.trim().slice(0, 80),
      x,
      y,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.customMarkers.add(marker);
    setPlacing(false);
    syncUrl({ focus: marker.id });
  };

  return (
    <>
      <PageHeader
        readout={`// district scan · ${displayMarkers.length} signals`}
        title={settings.conventionalLabels ? "Map" : "District Scan"}
        description="Original schematic layout — positions are approximate by design. Full-detail community maps are linked from each marker and the Archive."
        actions={
          playthrough && (
            <Button
              variant={placing ? "primary" : "outline"}
              aria-pressed={placing}
              onClick={() => setPlacing(!placing)}
            >
              {placing ? "Click map to place… (esc)" : "+ Custom marker"}
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="map-search" className="sr-only">
          Search markers
        </label>
        <Input
          id="map-search"
          type="search"
          placeholder="Search markers…"
          className="!w-full sm:!w-56"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label htmlFor="map-cat" className="sr-only">
          Category filter
        </label>
        <Select
          id="map-cat"
          className="!w-auto"
          value={category}
          onChange={(e) => {
            const val = e.target.value as MarkerCategory | "all";
            setCategory(val);
            syncUrl({ cat: val });
          }}
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
          className="!w-auto"
          value={district}
          onChange={(e) => {
            const val = e.target.value as District | "all";
            setDistrict(val);
            syncUrl({ d: val });
          }}
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
          aria-pressed={onlyIncomplete}
          onClick={() => setOnlyIncomplete(!onlyIncomplete)}
        >
          Incomplete only
        </Button>
        <Button
          size="sm"
          aria-pressed={onlyUndiscovered}
          onClick={() => setOnlyUndiscovered(!onlyUndiscovered)}
        >
          Undiscovered only
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="clip-panel h-[55dvh] overflow-hidden border border-line bg-panel lg:h-[65dvh]">
          <NightCityMap
            markers={displayMarkers}
            selectedId={selectedId}
            onSelect={(id) => syncUrl({ focus: id })}
            onMapClick={placing ? (x, y) => void addCustomMarker(x, y) : undefined}
            placing={placing}
          />
        </div>

        {/* Detail panel (desktop side / mobile bottom sheet) */}
        <div
          className={
            selected
              ? "fixed inset-x-0 bottom-0 z-40 max-h-[60dvh] overflow-y-auto border-t border-line-bright bg-panel p-4 lg:static lg:z-auto lg:max-h-none lg:border lg:border-line lg:clip-panel"
              : "hidden lg:block"
          }
        >
          {selected ? (
            <MarkerDetail
              marker={selected}
              playthroughId={playthrough?.id}
              onClose={() => syncUrl({ focus: null })}
              onDeleteCustom={
                selected.isCustom
                  ? () => {
                      void db.customMarkers.delete(selected.id);
                      syncUrl({ focus: null });
                    }
                  : undefined
              }
            />
          ) : (
            <EmptyState
              title="No marker selected"
              body="Select a signal on the scan to view its intel, completion state, and sources."
            />
          )}
        </div>
      </div>

      {!playthrough && (
        <p className="mt-3 text-sm text-ink-faint">
          <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
            Create a playthrough
          </Link>{" "}
          to track discovery and completion states per run.
        </p>
      )}
    </>
  );
}

function MarkerDetail({
  marker,
  playthroughId,
  onClose,
  onDeleteCustom,
}: {
  marker: DisplayMarker;
  playthroughId: string | undefined;
  onClose: () => void;
  onDeleteCustom?: () => void;
}) {
  const def = marker.def;
  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="readout">
            {MARKER_CATEGORY_LABEL[marker.category]} · {DISTRICT_LABEL[marker.district]}
          </p>
          <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
            {marker.shielded ? "Shielded signal" : marker.name}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close marker details"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-dim hover:text-signal"
        >
          ✕
        </button>
      </div>

      {def && marker.shielded ? (
        <SpoilerShield level={def.spoilerLevel} revealKey={def.id} label="Marker intel">
          <p className="text-sm text-ink-dim">{def.description}</p>
        </SpoilerShield>
      ) : (
        <p className="mb-3 text-sm text-ink-dim">
          {def?.description ?? marker.custom?.description ?? "Custom marker."}
        </p>
      )}

      {def?.expansion === "phantom_liberty" && (
        <Badge tone="violet" className="mb-3">
          Phantom Liberty
        </Badge>
      )}

      {playthroughId && !marker.isCustom && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={marker.discovered ? "outline" : "primary"}
            onClick={() =>
              void setMarkerProgress(playthroughId, marker.id, { discovered: !marker.discovered })
            }
          >
            {marker.discovered ? "Mark undiscovered" : "Mark discovered"}
          </Button>
          <Button
            size="sm"
            variant={marker.completed ? "outline" : "primary"}
            onClick={() =>
              void setMarkerProgress(playthroughId, marker.id, { completed: !marker.completed })
            }
          >
            {marker.completed ? "Mark incomplete" : "Mark completed"}
          </Button>
        </div>
      )}

      {def?.relatedJobId && (
        <p className="mb-3 text-sm">
          <Link
            href={`/jobs?focus=${encodeURIComponent(def.relatedJobId)}`}
            className="text-holo underline underline-offset-2"
          >
            Related job →
          </Link>
        </p>
      )}

      {onDeleteCustom && (
        <Button size="sm" variant="danger" onClick={onDeleteCustom} className="mb-3">
          Delete custom marker
        </Button>
      )}

      {def && !marker.shielded && <SourceList meta={def.meta} />}

      <p className="readout mt-3">Coordinates (schematic)</p>
      <p className="font-mono text-xs text-ink-faint">
        x {marker.x} · y {marker.y} — approximate schematic position
      </p>
    </div>
  );
}
