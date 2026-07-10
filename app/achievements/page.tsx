"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Panel,
  ProgressBar,
  Select,
} from "@/components/ui";
import { achievements } from "@/data/achievements";
import { db } from "@/lib/database/db";
import { upsertAchievementProgress } from "@/lib/database/repo";
import { useActivePlaythrough, useSettings } from "@/lib/hooks";
import { PLATFORM_LABEL } from "@/lib/labels";
import { achievementPercent, achievementSummary } from "@/lib/progress";
import type { AchievementDef, AchievementProgress, Platform } from "@/types/domain";

function AchievementCard({
  def,
  progress,
  playthroughId,
  focused,
}: {
  def: AchievementDef;
  progress: AchievementProgress | undefined;
  playthroughId: string;
  focused: boolean;
}) {
  const percent = achievementPercent(def, progress);
  const unlocked = progress?.state === "unlocked";
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center" });
  }, [focused]);

  return (
    <div ref={ref}>
      <Panel
        as="article"
        className={focused ? "!border-holo" : undefined}
        readout={`// ${def.expansion === "phantom_liberty" ? "phantom liberty" : "base game"} · difficulty ${def.difficulty ?? "?"}/5`}
        title={
          <span className="flex items-center gap-2">
            <span className={unlocked ? "text-lime" : undefined}>{def.name}</span>
            {unlocked && <Badge tone="lime">Unlocked</Badge>}
            {def.missable && <Badge tone="amber">Missable</Badge>}
            {def.isSecret && <Badge tone="signal">Secret</Badge>}
          </span>
        }
        actions={
          <Button
            size="sm"
            variant={unlocked ? "outline" : "primary"}
            onClick={() =>
              void upsertAchievementProgress(playthroughId, def.id, {
                state: unlocked ? "locked" : "unlocked",
              })
            }
          >
            {unlocked ? "Relock" : "Mark unlocked"}
          </Button>
        }
      >
        <p className="mb-2 text-sm text-ink-dim">{def.descriptionPublic}</p>
        {def.descriptionHidden && (
          <SpoilerShield level={def.spoilerLevel} revealKey={def.id} label="Hidden requirement">
            <p className="mb-2 border-l-2 border-signal/50 pl-3 text-sm text-ink-dim">
              {def.descriptionHidden}
            </p>
          </SpoilerShield>
        )}

        {def.progressModel.type === "count" && (
          <div className="mb-3 flex items-center gap-3">
            <label htmlFor={`count-${def.id}`} className="readout">
              Progress ({def.progressModel.unit ?? "count"})
            </label>
            <Input
              id={`count-${def.id}`}
              type="number"
              min={0}
              max={def.progressModel.target}
              className="!w-24"
              value={progress?.count ?? 0}
              onChange={(e) => {
                const target = def.progressModel.type === "count" ? def.progressModel.target : 0;
                const count = Math.min(target, Math.max(0, Number(e.target.value) || 0));
                void upsertAchievementProgress(playthroughId, def.id, {
                  count,
                  state: count >= target ? "unlocked" : count > 0 ? "in_progress" : "locked",
                });
              }}
            />
            <span className="font-mono text-xs text-ink-faint">/ {def.progressModel.target}</span>
          </div>
        )}

        {def.progressModel.type === "percent" && (
          <div className="mb-3 flex items-center gap-3">
            <label htmlFor={`pct-${def.id}`} className="readout">
              Progress %
            </label>
            <Input
              id={`pct-${def.id}`}
              type="number"
              min={0}
              max={100}
              className="!w-24"
              value={progress?.count ?? 0}
              onChange={(e) => {
                const count = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                void upsertAchievementProgress(playthroughId, def.id, {
                  count,
                  state: count >= 100 ? "unlocked" : count > 0 ? "in_progress" : "locked",
                });
              }}
            />
          </div>
        )}

        {def.progressModel.type === "checklist" && (
          <ul className="mb-3 space-y-1.5">
            {def.progressModel.steps.map((step) => {
              const done = (progress?.steps ?? []).includes(step.id);
              return (
                <li key={step.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[#58e6d9]"
                      checked={done}
                      onChange={(e) => {
                        const current = new Set(progress?.steps ?? []);
                        if (e.target.checked) current.add(step.id);
                        else current.delete(step.id);
                        const steps = [...current];
                        const total =
                          def.progressModel.type === "checklist"
                            ? def.progressModel.steps.length
                            : 0;
                        void upsertAchievementProgress(playthroughId, def.id, {
                          steps,
                          state:
                            steps.length >= total
                              ? "unlocked"
                              : steps.length > 0
                                ? "in_progress"
                                : "locked",
                        });
                      }}
                    />
                    <span className={done ? "text-ink-faint line-through" : "text-ink-dim"}>
                      {step.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <ProgressBar
          value={percent}
          label={`${def.name} progress`}
          tone={unlocked ? "lime" : "holo"}
          className="mb-3"
        />

        <details>
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-ink-faint hover:text-holo">
            Provenance & platforms
          </summary>
          <div className="mt-2">
            <p className="mb-1 text-xs text-ink-faint">
              Platforms: {def.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")}
            </p>
            <SourceList meta={def.meta} />
          </div>
        </details>
      </Panel>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <React.Suspense fallback={null}>
      <AchievementsPageInner />
    </React.Suspense>
  );
}

function AchievementsPageInner() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();
  const params = useSearchParams();
  const focusId = params.get("focus");
  const [platform, setPlatform] = React.useState<Platform | "all">("all");
  const [expansion, setExpansion] = React.useState<"all" | "base" | "phantom_liberty">("all");
  const [hideUnlocked, setHideUnlocked] = React.useState(false);

  const progress = useLiveQuery(
    async () =>
      playthrough
        ? db.achievementProgress.where("playthroughId").equals(playthrough.id).toArray()
        : [],
    [playthrough?.id],
  );

  if (!playthrough) {
    return (
      <>
        <PageHeader readout="// accolades" title="Achievements" />
        <EmptyState
          title="No active run"
          body="Achievement progress is tracked per playthrough."
          action={
            <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
              Create one now →
            </Link>
          }
        />
      </>
    );
  }

  const byId = new Map((progress ?? []).map((p) => [p.achievementId, p]));
  const visible = achievements
    .filter((a) => a.expansion === "base" || playthrough.hasPhantomLiberty)
    .filter((a) => platform === "all" || a.platforms.includes(platform))
    .filter((a) => expansion === "all" || a.expansion === expansion)
    .filter((a) => !hideUnlocked || byId.get(a.id)?.state !== "unlocked");

  const summary = achievementSummary(
    achievements.filter((a) => a.expansion === "base" || playthrough.hasPhantomLiberty),
    progress ?? [],
  );

  return (
    <>
      <PageHeader
        readout={`// accolades · ${summary.unlocked}/${summary.total} unlocked`}
        title={settings.conventionalLabels ? "Achievements" : "Accolades"}
        description="Secret achievements stay shielded until you reveal them. Progress models: one-shot, counters, and checklists."
        actions={
          <div className="w-40">
            <p className="readout mb-1">{summary.percent}% complete</p>
            <ProgressBar value={summary.percent} label="Achievement completion" tone="violet" />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="ach-platform" className="sr-only">
          Filter by platform
        </label>
        <Select
          id="ach-platform"
          className="!w-auto"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform | "all")}
        >
          <option value="all">All platforms</option>
          {Object.entries(PLATFORM_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <label htmlFor="ach-expansion" className="sr-only">
          Filter by expansion
        </label>
        <Select
          id="ach-expansion"
          className="!w-auto"
          value={expansion}
          onChange={(e) => setExpansion(e.target.value as "all" | "base" | "phantom_liberty")}
        >
          <option value="all">Base + expansion</option>
          <option value="base">Base game</option>
          <option value="phantom_liberty">Phantom Liberty</option>
        </Select>
        <Button
          size="sm"
          aria-pressed={hideUnlocked}
          onClick={() => setHideUnlocked(!hideUnlocked)}
        >
          {hideUnlocked ? "Show unlocked" : "Hide unlocked"}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {visible.map((def) => (
          <AchievementCard
            key={def.id}
            def={def}
            progress={byId.get(def.id)}
            playthroughId={playthrough.id}
            focused={focusId === def.id}
          />
        ))}
      </div>
    </>
  );
}
