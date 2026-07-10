"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  Textarea,
} from "@/components/ui";
import { attributes, perks, progressionRules, relicPerks } from "@/data/build";
import { db } from "@/lib/database/db";
import { duplicateBuild, emptyBuild, saveBuild } from "@/lib/database/repo";
import { useActivePlaythrough, useSettings } from "@/lib/hooks";
import {
  ATTRIBUTE_IDS,
  BUILD_TAGS,
  decodeBuildFromUrlParam,
  encodeBuildToUrlParam,
  validateBuild,
} from "@/lib/build-planner";
import type { AttributeId, Build } from "@/types/domain";

export default function BuildsPage() {
  return (
    <React.Suspense fallback={null}>
      <BuildsPageInner />
    </React.Suspense>
  );
}

function BuildsPageInner() {
  const settings = useSettings();
  const { playthrough } = useActivePlaythrough();
  const params = useSearchParams();
  const builds = useLiveQuery(() => db.builds.orderBy("updatedAt").reverse().toArray(), []);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [shareNotice, setShareNotice] = React.useState<string | null>(null);
  const importedRef = React.useRef(false);

  // Handle deep links: ?focus=<id>, ?new=1, ?b=<encoded build>
  React.useEffect(() => {
    const focus = params.get("focus");
    if (focus) setSelectedId(focus);
    if (params.get("new") === "1" && !importedRef.current) {
      importedRef.current = true;
      const build = emptyBuild("Untitled build", playthrough?.id);
      void saveBuild(build).then(() => setSelectedId(build.id));
    }
    const encoded = params.get("b");
    if (encoded && !importedRef.current) {
      importedRef.current = true;
      const partial = decodeBuildFromUrlParam(encoded);
      if (partial) {
        const build: Build = {
          ...emptyBuild(partial.name ?? "Shared build", playthrough?.id),
          ...partial,
          equipment: emptyBuild("x").equipment,
        };
        void saveBuild(build).then(() => setSelectedId(build.id));
      }
    }
  }, [params, playthrough?.id]);

  const selected = (builds ?? []).find((b) => b.id === selectedId) ?? (builds ?? [])[0];

  const createNew = async () => {
    const build = emptyBuild("Untitled build", playthrough?.id);
    await saveBuild(build);
    setSelectedId(build.id);
  };

  const share = async (build: Build) => {
    const url = `${window.location.origin}/builds?b=${encodeBuildToUrlParam(build)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Share link copied to clipboard.");
    } catch {
      setShareNotice(url);
    }
    setTimeout(() => setShareNotice(null), 4000);
  };

  const exportJson = (build: Build) => {
    const blob = new Blob([JSON.stringify(build, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-${build.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        readout={`// build matrix · rules v${progressionRules.gameVersion}`}
        title={settings.conventionalLabels ? "Build Planner" : "Build Matrix"}
        description="Plan attributes, perks, and relic upgrades against 2.x constraints. Mechanical values are sourced and version-labeled — never invented."
        actions={
          <Button variant="primary" onClick={() => void createNew()}>
            + New build
          </Button>
        }
      />

      {shareNotice && (
        <p
          role="status"
          className="clip-chip mb-4 border border-lime/50 bg-panel-2 px-3 py-2 text-sm text-lime"
        >
          {shareNotice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Panel readout="// saved builds" title={`Builds (${(builds ?? []).length})`}>
          {(builds ?? []).length === 0 ? (
            <p className="text-sm text-ink-faint">No builds yet.</p>
          ) : (
            <ul className="space-y-1">
              {(builds ?? []).map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    aria-current={selected?.id === b.id}
                    className={`clip-chip w-full min-h-[44px] border px-3 py-2 text-left text-sm ${
                      selected?.id === b.id
                        ? "border-holo bg-panel-3 text-holo"
                        : "border-line text-ink-dim hover:text-ink"
                    }`}
                  >
                    <span className="block truncate font-semibold">{b.name}</span>
                    <span className="readout">
                      lvl {b.targetLevel} · {b.tags.slice(0, 2).join(" · ") || "untagged"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {selected ? (
          <BuildEditor
            key={selected.id}
            build={selected}
            onShare={() => void share(selected)}
            onExport={() => exportJson(selected)}
            onDuplicate={() =>
              void duplicateBuild(selected.id).then((copy) => copy && setSelectedId(copy.id))
            }
            onDelete={() => {
              void db.builds.delete(selected.id);
              setSelectedId(null);
            }}
          />
        ) : (
          <EmptyState
            title="No build selected"
            body="Create a build to start planning attributes and perks."
            action={
              <Button variant="primary" onClick={() => void createNew()}>
                + New build
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}

function BuildEditor({
  build,
  onShare,
  onExport,
  onDuplicate,
  onDelete,
}: {
  build: Build;
  onShare: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const validation = validateBuild(build);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const update = (patch: Partial<Build>) => {
    void saveBuild({ ...build, ...patch });
  };

  const setAttribute = (attr: AttributeId, value: number) => {
    const clamped = Math.min(
      progressionRules.attributeMax,
      Math.max(progressionRules.attributeMin, value),
    );
    update({ attributes: { ...build.attributes, [attr]: clamped } });
  };

  const togglePerk = (perkId: string) => {
    const perksNext = { ...build.perks };
    if (perksNext[perkId]) delete perksNext[perkId];
    else perksNext[perkId] = 1;
    update({ perks: perksNext });
  };

  const toggleRelic = (relicId: string) => {
    update({
      relicPerks: build.relicPerks.includes(relicId)
        ? build.relicPerks.filter((r) => r !== relicId)
        : [...build.relicPerks, relicId],
    });
  };

  const toggleTag = (tag: string) => {
    update({
      tags: build.tags.includes(tag) ? build.tags.filter((t) => t !== tag) : [...build.tags, tag],
    });
  };

  return (
    <div className="min-w-0 space-y-4">
      <Panel
        readout={`// build ${build.id.slice(-6)} · game v${build.gameVersion}`}
        title="Configuration"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onShare}>
              Share link
            </Button>
            <Button size="sm" onClick={onExport}>
              Export JSON
            </Button>
            <Button size="sm" onClick={onDuplicate}>
              Duplicate
            </Button>
            {confirmDelete ? (
              <>
                <Button size="sm" variant="danger" onClick={onDelete}>
                  Confirm
                </Button>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </>
            ) : (
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Build name" htmlFor="build-name">
            <Input
              id="build-name"
              value={build.name}
              maxLength={80}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field
            label={`Target level (max ${progressionRules.maxLevelPhantomLiberty})`}
            htmlFor="build-level"
            hint={`Attribute points stop accruing at level ${progressionRules.attributePointCapLevel}.`}
          >
            <Input
              id="build-level"
              type="number"
              min={1}
              max={progressionRules.maxLevelPhantomLiberty}
              value={build.targetLevel}
              onChange={(e) =>
                update({
                  targetLevel: Math.min(
                    progressionRules.maxLevelPhantomLiberty,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
            />
          </Field>
        </div>
        <div className="mt-3">
          <p className="readout mb-1.5">Build tags</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Build tags">
            {BUILD_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={build.tags.includes(tag)}
                onClick={() => toggleTag(tag)}
                className={`clip-chip min-h-[36px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  build.tags.includes(tag)
                    ? "border-holo bg-panel-3 text-holo"
                    : "border-line text-ink-dim hover:text-ink"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Validation */}
      <Panel
        readout="// constraint check"
        title={validation.valid ? "Build valid" : `${validation.violations.length} issue(s)`}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ReadoutStat
            label="Attr points spent"
            value={`${validation.attributePointsSpent}/${validation.attributePointsAvailable}`}
            alert={validation.attributePointsSpent > validation.attributePointsAvailable}
          />
          <ReadoutStat
            label="Attr points left"
            value={String(validation.attributePointsRemaining)}
          />
          <ReadoutStat label="Perk points spent" value={String(validation.perkPointsSpent)} />
          <ReadoutStat label="Relic points" value={String(validation.relicPointsSpent)} />
        </div>
        {validation.violations.length > 0 && (
          <ul className="space-y-1" aria-label="Constraint violations">
            {validation.violations.map((v) => (
              <li key={v} className="flex items-start gap-2 text-sm text-signal">
                <span aria-hidden="true">▲</span>
                {v}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Attributes */}
      <Panel readout="// attributes" title="Attribute allocation">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attributes.map((attr) => {
            const value = build.attributes[attr.id];
            return (
              <div key={attr.id} className="clip-chip border border-line bg-panel-2 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-ink">
                    {attr.name}
                  </span>
                  <span className="font-mono text-xl font-bold text-holo">{value}</span>
                </div>
                <p className="mb-3 text-xs leading-snug text-ink-faint">{attr.description}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    aria-label={`Decrease ${attr.name}`}
                    disabled={value <= progressionRules.attributeMin}
                    onClick={() => setAttribute(attr.id, value - 1)}
                  >
                    −
                  </Button>
                  <input
                    type="range"
                    aria-label={`${attr.name} value`}
                    min={progressionRules.attributeMin}
                    max={progressionRules.attributeMax}
                    value={value}
                    onChange={(e) => setAttribute(attr.id, Number(e.target.value))}
                    className="w-full accent-[#58e6d9]"
                  />
                  <Button
                    size="sm"
                    aria-label={`Increase ${attr.name}`}
                    disabled={value >= progressionRules.attributeMax}
                    onClick={() => setAttribute(attr.id, value + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Perks */}
      <Panel readout="// perk lattice · starter dataset" title="Perks">
        <div className="grid gap-4 md:grid-cols-2">
          {ATTRIBUTE_IDS.map((attrId) => {
            const attrPerks = perks.filter((p) => p.attribute === attrId);
            if (attrPerks.length === 0) return null;
            const attrName = attributes.find((a) => a.id === attrId)?.name ?? attrId;
            return (
              <div key={attrId}>
                <h3 className="readout mb-2">
                  {attrName} — {build.attributes[attrId]}
                </h3>
                <ul className="space-y-1.5">
                  {attrPerks.map((perk) => {
                    const taken = Boolean(build.perks[perk.id]);
                    const attrMet = build.attributes[attrId] >= perk.requiredAttribute;
                    const prereqMet = (perk.requiresPerkIds ?? []).every((r) =>
                      Boolean(build.perks[r]),
                    );
                    return (
                      <li key={perk.id}>
                        <button
                          type="button"
                          aria-pressed={taken}
                          onClick={() => togglePerk(perk.id)}
                          className={`clip-chip w-full border px-3 py-2 text-left ${
                            taken
                              ? attrMet && prereqMet
                                ? "border-holo bg-panel-3"
                                : "border-signal bg-panel-3"
                              : "border-line hover:border-line-bright"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${taken ? "text-holo" : "text-ink"}`}
                            >
                              {perk.name}
                            </span>
                            <span className="flex items-center gap-1">
                              {perk.expansion === "phantom_liberty" && (
                                <Badge tone="violet">PL</Badge>
                              )}
                              <Badge tone={attrMet ? "neutral" : "signal"}>
                                req {perk.requiredAttribute}
                              </Badge>
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-faint">
                            {perk.effectSummary}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-ink-faint hover:text-holo">
            Data provenance
          </summary>
          <div className="mt-2 space-y-2">
            <SourceList meta={progressionRules.meta} />
          </div>
        </details>
      </Panel>

      {/* Relic perks */}
      <Panel readout="// relic · phantom liberty" title="Relic perks">
        <ul className="grid gap-2 sm:grid-cols-3">
          {relicPerks.map((relic) => {
            const taken = build.relicPerks.includes(relic.id);
            return (
              <li key={relic.id}>
                <button
                  type="button"
                  aria-pressed={taken}
                  onClick={() => toggleRelic(relic.id)}
                  className={`clip-chip h-full w-full border px-3 py-2 text-left ${
                    taken ? "border-violet bg-panel-3" : "border-line hover:border-line-bright"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${taken ? "text-violet" : "text-ink"}`}
                  >
                    {relic.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-faint">{relic.effectSummary}</span>
                  <Badge tone="violet" className="mt-1.5">
                    {relic.cost} relic pts
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* Equipment & notes */}
      <Panel readout="// loadout" title="Equipment & notes">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Weapons (one per line)"
            htmlFor="build-weapons"
            hint="Free text for now — link to Collections for iconic tracking."
          >
            <Textarea
              id="build-weapons"
              value={build.equipment.weapons.join("\n")}
              onChange={(e) =>
                update({
                  equipment: {
                    ...build.equipment,
                    weapons: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <Field label="Cyberware (one per line)" htmlFor="build-cyberware">
            <Textarea
              id="build-cyberware"
              value={build.equipment.cyberware.join("\n")}
              onChange={(e) =>
                update({
                  equipment: {
                    ...build.equipment,
                    cyberware: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <Field label="Operating system" htmlFor="build-os">
            <Input
              id="build-os"
              value={build.equipment.operatingSystem ?? ""}
              placeholder="e.g. Sandevistan, Cyberdeck, Berserk"
              onChange={(e) =>
                update({
                  equipment: { ...build.equipment, operatingSystem: e.target.value || undefined },
                })
              }
            />
          </Field>
          <Field label="Quickhacks (one per line)" htmlFor="build-quickhacks">
            <Textarea
              id="build-quickhacks"
              value={build.equipment.quickhacks.join("\n")}
              onChange={(e) =>
                update({
                  equipment: {
                    ...build.equipment,
                    quickhacks: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
            />
          </Field>
        </div>
        <Field label="Build notes" htmlFor="build-notes" className="mt-3">
          <Textarea
            id="build-notes"
            value={build.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value || undefined })}
            placeholder="Level milestones, rotation, playstyle…"
          />
        </Field>
      </Panel>
    </div>
  );
}

function ReadoutStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="clip-chip border border-line bg-panel-2 px-3 py-2">
      <p className="readout">{label}</p>
      <p className={`font-mono text-lg font-bold ${alert ? "text-signal" : "text-ink"}`}>{value}</p>
    </div>
  );
}
