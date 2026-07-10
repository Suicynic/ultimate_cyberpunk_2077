"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { Badge, EmptyState, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { collectibles } from "@/data/collections";
import { db } from "@/lib/database/db";
import { setCollectibleState } from "@/lib/database/repo";
import { useActivePlaythrough, useSettings } from "@/lib/hooks";
import { COLLECTIBLE_STATE_LABEL, COLLECTIBLE_TYPE_LABEL, DISTRICT_LABEL } from "@/lib/labels";
import { collectibleSummary } from "@/lib/progress";
import type { CollectibleState, CollectibleType } from "@/types/domain";

/** Categories are opt-in so players aren't forced to track low-value items. */
const DEFAULT_ENABLED: CollectibleType[] = ["iconic_weapon", "vehicle", "apartment", "tarot_card"];

export default function CollectionsPage() {
  return (
    <React.Suspense fallback={null}>
      <CollectionsPageInner />
    </React.Suspense>
  );
}

function CollectionsPageInner() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();
  const params = useSearchParams();
  const focusId = params.get("focus");
  const [enabledTypes, setEnabledTypes] = React.useState<Set<CollectibleType>>(
    new Set(DEFAULT_ENABLED),
  );

  const progress = useLiveQuery(
    async () =>
      playthrough
        ? db.collectibleProgress.where("playthroughId").equals(playthrough.id).toArray()
        : [],
    [playthrough?.id],
  );

  if (!playthrough) {
    return (
      <>
        <PageHeader readout="// cache" title="Collections" />
        <EmptyState
          title="No active run"
          body="Collection states are tracked per playthrough."
          action={
            <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
              Create one now →
            </Link>
          }
        />
      </>
    );
  }

  const byId = new Map((progress ?? []).map((p) => [p.collectibleId, p]));
  const available = collectibles.filter(
    (c) => c.expansion === "base" || playthrough.hasPhantomLiberty,
  );
  const allTypes = [...new Set(available.map((c) => c.type))];
  const summary = collectibleSummary(
    available.filter((c) => enabledTypes.has(c.type)).length,
    (progress ?? []).filter((p) => {
      const def = available.find((c) => c.id === p.collectibleId);
      return def ? enabledTypes.has(def.type) : false;
    }),
  );

  return (
    <>
      <PageHeader
        readout={`// cache · ${summary.obtained}/${summary.total} secured`}
        title={settings.conventionalLabels ? "Collections" : "Loadout & Cache"}
        description="Track iconics, vehicles, apartments, and other discoveries. Enable only the categories you care about."
        actions={
          <div className="w-40">
            <p className="readout mb-1">{summary.percent}%</p>
            <ProgressBar value={summary.percent} label="Collection completion" tone="amber" />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Enabled categories">
        {allTypes.map((type) => {
          const enabled = enabledTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={enabled}
              onClick={() => {
                const next = new Set(enabledTypes);
                if (enabled) next.delete(type);
                else next.add(type);
                setEnabledTypes(next);
              }}
              className={`clip-chip min-h-[36px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                enabled
                  ? "border-holo bg-panel-3 text-holo"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {COLLECTIBLE_TYPE_LABEL[type]}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {allTypes
          .filter((t) => enabledTypes.has(t))
          .map((type) => {
            const items = available.filter((c) => c.type === type);
            return (
              <section key={type} aria-label={COLLECTIBLE_TYPE_LABEL[type]}>
                <h2 className="readout mb-2 !text-ink-dim">
                  {COLLECTIBLE_TYPE_LABEL[type]} ·{" "}
                  {
                    items.filter((i) => {
                      const st = byId.get(i.id)?.state;
                      return st && st !== "not_obtained" && st !== "missed" && st !== "sold";
                    }).length
                  }
                  /{items.length}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item) => {
                    const state = byId.get(item.id)?.state ?? "not_obtained";
                    const focused = focusId === item.id;
                    return (
                      <Panel
                        key={item.id}
                        as="article"
                        className={focused ? "!border-holo" : undefined}
                        title={
                          <span className="flex items-center gap-2">
                            {item.name}
                            {item.missable && <Badge tone="amber">Missable</Badge>}
                            {item.expansion === "phantom_liberty" && (
                              <Badge tone="violet">PL</Badge>
                            )}
                          </span>
                        }
                        readout={`// ${item.district ? DISTRICT_LABEL[item.district] : "various"}`}
                        actions={
                          <>
                            <label htmlFor={`state-${item.id}`} className="sr-only">
                              State for {item.name}
                            </label>
                            <select
                              id={`state-${item.id}`}
                              value={state}
                              onChange={(e) =>
                                void setCollectibleState(
                                  playthrough.id,
                                  item.id,
                                  e.target.value as CollectibleState,
                                )
                              }
                              className={`clip-chip min-h-[36px] border bg-panel-2 px-2 py-1 font-mono text-[11px] uppercase tracking-wider ${
                                state === "not_obtained"
                                  ? "border-line text-ink-dim"
                                  : state === "missed" || state === "sold"
                                    ? "border-signal/60 text-signal"
                                    : "border-lime/60 text-lime"
                              }`}
                            >
                              {Object.entries(COLLECTIBLE_STATE_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </>
                        }
                      >
                        <SpoilerShield
                          level={item.spoilerLevel}
                          revealKey={item.id}
                          label="Acquisition intel"
                        >
                          <p className="mb-2 text-sm text-ink-dim">{item.acquisition}</p>
                        </SpoilerShield>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {item.relatedJobId && (
                            <Link
                              href={`/jobs?focus=${encodeURIComponent(item.relatedJobId)}`}
                              className="text-holo underline underline-offset-2"
                            >
                              Related job →
                            </Link>
                          )}
                          {item.relatedMarkerId && (
                            <Link
                              href={`/map?focus=${encodeURIComponent(item.relatedMarkerId)}`}
                              className="text-holo underline underline-offset-2"
                            >
                              On the map →
                            </Link>
                          )}
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs uppercase tracking-wider text-ink-faint hover:text-holo">
                            Provenance
                          </summary>
                          <SourceList meta={item.meta} className="mt-2" />
                        </details>
                      </Panel>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </>
  );
}
