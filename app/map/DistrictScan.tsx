"use client";

import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { MapFilters, type CategoryFilter, type DistrictFilter } from "@/app/map/MapFilters";
import { MapLegend } from "@/app/map/MapLegend";
import { MarkerDetail } from "@/app/map/MarkerDetail";
import { buttonClasses, PageHeader } from "@/components/ui";
import { mapMarkers } from "@/data/map";
import { db } from "@/lib/database/db";
import { newId, nowIso } from "@/lib/ids";
import { useActivePlaythrough, useSettings, useSpoilerGuard } from "@/lib/hooks";
import { DISTRICT_LABEL, MARKER_CATEGORY_LABEL } from "@/lib/labels";
import type { DisplayMarker } from "@/lib/map/markers";
import type { MarkerCategory } from "@/types/domain";

const NightCityMap = dynamic(() => import("@/components/map/NightCityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-faint">
      Booting district scan…
    </div>
  ),
});

export function DistrictScan() {
  return (
    <React.Suspense fallback={null}>
      <DistrictScanInner />
    </React.Suspense>
  );
}

function DistrictScanInner() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();
  const guard = useSpoilerGuard();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Category + district are derived straight from the URL (single source of
  // truth) so browser back/forward and internal links keep the controls and the
  // visible markers in sync. Search + the two toggles are ephemeral local state.
  const category = (params.get("cat") as CategoryFilter) ?? "all";
  const district = (params.get("d") as DistrictFilter) ?? "all";
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

  // All signals available on the map (before the user's filters) — the "M" in
  // "N of M", and the source for map-context counts.
  const available: DisplayMarker[] = [
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
  ];

  const displayMarkers = available
    .filter((m) => category === "all" || m.category === category)
    .filter((m) => district === "all" || m.district === district)
    .filter((m) => !onlyIncomplete || !m.completed)
    .filter((m) => !onlyUndiscovered || !m.discovered)
    .filter(
      (m) => !query.trim() || m.shielded || m.name.toLowerCase().includes(query.toLowerCase()),
    );

  const selected = displayMarkers.find((m) => m.id === selectedId) ?? null;

  // Spoiler-safe legend + summary.
  const categoriesPresent = Array.from(
    new Set(displayMarkers.map((m) => m.category)),
  ) as MarkerCategory[];

  // Stable keys (not the label text) so two filters whose labels happen to match
  // — e.g. a search term equal to a category name — never collide as React keys.
  const filterSummary: { key: string; label: string }[] = [];
  if (query.trim()) filterSummary.push({ key: "search", label: `“${query.trim()}”` });
  if (category !== "all")
    filterSummary.push({ key: "category", label: MARKER_CATEGORY_LABEL[category] });
  if (district !== "all") filterSummary.push({ key: "district", label: DISTRICT_LABEL[district] });
  if (onlyIncomplete) filterSummary.push({ key: "incomplete", label: "Incomplete" });
  if (onlyUndiscovered) filterSummary.push({ key: "undiscovered", label: "Undiscovered" });
  const hasActiveFilters = filterSummary.length > 0;

  const clearFilters = () => {
    setQuery("");
    setOnlyIncomplete(false);
    setOnlyUndiscovered(false);
    syncUrl({ cat: "all", d: "all" });
  };

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

  // Discovery/completion are only tracked for canonical markers, so the ratios
  // must be denominated by the canonical count — custom markers (always shown as
  // "discovered", never completable) would otherwise skew both numerators.
  const trackableCount = available.filter((m) => !m.isCustom).length;
  const discoveredCount = available.filter((m) => !m.isCustom && m.discovered).length;
  const completedCount = available.filter((m) => !m.isCustom && m.completed).length;
  const districtCount = new Set(available.map((m) => m.district)).size;

  return (
    <>
      <PageHeader
        readout={`// district scan · ${displayMarkers.length} signals`}
        title={settings.conventionalLabels ? "Map" : "District Scan"}
        description="An original, deliberately approximate schematic of Night City — full-detail community maps are linked from each marker."
        actions={
          playthrough && (
            <button
              type="button"
              className={buttonClasses(placing ? "primary" : "outline")}
              aria-pressed={placing}
              onClick={() => setPlacing(!placing)}
            >
              {placing ? "Click map to place… (esc)" : "+ Custom marker"}
            </button>
          )
        }
      />

      {!playthrough && <NoPlaythroughCallout />}

      <MapFilters
        query={query}
        onQuery={setQuery}
        category={category}
        onCategory={(v) => syncUrl({ cat: v })}
        district={district}
        onDistrict={(v) => syncUrl({ d: v })}
        onlyIncomplete={onlyIncomplete}
        onToggleIncomplete={() => setOnlyIncomplete((v) => !v)}
        onlyUndiscovered={onlyUndiscovered}
        onToggleUndiscovered={() => setOnlyUndiscovered((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="clip-panel h-[58dvh] overflow-hidden border border-line bg-panel lg:h-[72dvh]">
            <NightCityMap
              markers={displayMarkers}
              selectedId={selectedId}
              onSelect={(id) => syncUrl({ focus: id })}
              onMapClick={placing ? (x, y) => void addCustomMarker(x, y) : undefined}
              placing={placing}
            />
          </div>
          <MapLegend
            visibleCount={displayMarkers.length}
            totalCount={available.length}
            categories={categoriesPresent}
            filterSummary={filterSummary}
          />
        </div>

        {/* Detail panel (desktop side / mobile bottom sheet) */}
        <div
          data-testid="detail-panel"
          data-mode={selected ? "sheet" : "standby"}
          className={
            selected
              ? // Mobile bottom sheet pinned to the bottom edge + full width: pad
                // its bottom past the home indicator and its sides past landscape
                // insets. On lg it becomes a static side panel (insets are 0 on
                // desktop, so the base p-4 spacing is preserved).
                "scroll-thin fixed inset-x-0 bottom-0 z-40 max-h-[60dvh] overflow-y-auto border-t border-line-bright bg-panel pt-4 pb-safe [--sa-pb:1rem] px-safe [--sa-px:1rem] lg:static lg:z-auto lg:max-h-none lg:border lg:border-line lg:clip-panel lg:p-4"
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
            <NoSelectionPanel
              hasPlaythrough={!!playthrough}
              signalCount={available.length}
              trackableCount={trackableCount}
              districtCount={districtCount}
              discoveredCount={discoveredCount}
              completedCount={completedCount}
            />
          )}
        </div>
      </div>
    </>
  );
}

/** Compact standby panel shown on desktop when no marker is selected. */
function NoSelectionPanel({
  hasPlaythrough,
  signalCount,
  trackableCount,
  districtCount,
  discoveredCount,
  completedCount,
}: {
  hasPlaythrough: boolean;
  signalCount: number;
  trackableCount: number;
  districtCount: number;
  discoveredCount: number;
  completedCount: number;
}) {
  return (
    <div className="clip-panel border border-dashed border-line bg-panel-2/50 p-4">
      <p className="readout">{"// standby"}</p>
      <h2 className="mt-1 text-sm font-semibold uppercase tracking-wider text-ink">
        No signal selected
      </h2>
      <p className="mt-2 text-sm text-ink-dim">
        Select a marker on the scan to open its intel, sources and per-run tracking. Use the filters
        above to narrow the field, or drag to pan and scroll to zoom.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wider">
        <div>
          <dt className="text-ink-faint">Signals</dt>
          <dd className="text-ink">{signalCount}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Districts</dt>
          <dd className="text-ink">{districtCount}</dd>
        </div>
        {hasPlaythrough && (
          <>
            <div>
              <dt className="text-ink-faint">Discovered</dt>
              <dd className="text-holo">
                {discoveredCount}/{trackableCount}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Completed</dt>
              <dd className="text-lime">
                {completedCount}/{trackableCount}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

/**
 * NC/OS callout shown when there is no active run. Browsing the map is fully
 * available without a playthrough; only discovery/completion tracking needs one.
 */
function NoPlaythroughCallout() {
  return (
    <div className="clip-panel mb-4 flex flex-col gap-3 border border-line-bright bg-panel-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="readout !text-holo">{"// scan online · read-only"}</p>
        <p className="mt-1 text-sm text-ink-dim">
          Browse every signal and open its intel without a run. Start a playthrough to track
          discovery and completion, and to drop your own custom markers.
        </p>
      </div>
      <Link
        href="/playthroughs?new=1"
        className={`${buttonClasses("primary")} shrink-0 whitespace-nowrap`}
      >
        Create a playthrough
      </Link>
    </div>
  );
}
