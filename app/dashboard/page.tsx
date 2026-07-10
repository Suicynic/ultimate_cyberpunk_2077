"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import * as React from "react";
import { Badge, Button, EmptyState, Input, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { achievements } from "@/data/achievements";
import { collectibles } from "@/data/collections";
import { jobs } from "@/data/jobs";
import { db } from "@/lib/database/db";
import { newId, nowIso } from "@/lib/ids";
import { useActivePlaythrough, useSettings } from "@/lib/hooks";
import {
  achievementSummary,
  allCategoryProgress,
  collectibleSummary,
  overallCompletion,
  suggestedNextJobs,
} from "@/lib/progress";
import { JOB_CATEGORY_LABEL, LIFEPATH_LABEL, PLAYTHROUGH_STATUS_LABEL } from "@/lib/labels";

export default function DashboardPage() {
  const { playthrough, loading } = useActivePlaythrough();
  const settings = useSettings();

  const jobProgress = useLiveQuery(
    async () =>
      playthrough ? db.jobProgress.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );
  const achProgress = useLiveQuery(
    async () =>
      playthrough
        ? db.achievementProgress.where("playthroughId").equals(playthrough.id).toArray()
        : [],
    [playthrough?.id],
  );
  const colProgress = useLiveQuery(
    async () =>
      playthrough
        ? db.collectibleProgress.where("playthroughId").equals(playthrough.id).toArray()
        : [],
    [playthrough?.id],
  );
  const pins = useLiveQuery(
    async () =>
      playthrough ? db.pins.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );
  const notes = useLiveQuery(
    async () =>
      playthrough
        ? (await db.notes.where("playthroughId").equals(playthrough.id).sortBy("updatedAt"))
            .reverse()
            .slice(0, 5)
        : [],
    [playthrough?.id],
  );
  const recentJobs = useLiveQuery(
    async () =>
      playthrough
        ? (
            await db.jobProgress
              .where("playthroughId")
              .equals(playthrough.id)
              .and((p) => p.status === "completed")
              .sortBy("updatedAt")
          ).reverse()
        : [],
    [playthrough?.id],
  );

  const [noteDraft, setNoteDraft] = React.useState("");

  if (!loading && !playthrough) {
    return (
      <>
        <PageHeader
          readout="// command center"
          title={settings.conventionalLabels ? "Dashboard" : "Command Center"}
        />
        <EmptyState
          title="No active run detected"
          body="Create a playthrough to start tracking jobs, achievements, builds, and discoveries. Everything stays local to this browser."
          action={
            <Link
              href="/playthroughs?new=1"
              className="clip-chip inline-flex min-h-[44px] items-center border border-holo bg-holo px-4 text-sm font-semibold uppercase tracking-wider text-void hover:bg-holo-dim"
            >
              + Create playthrough
            </Link>
          }
        />
      </>
    );
  }

  if (!playthrough) return null;

  const jp = jobProgress ?? [];
  // One expansion-filtered dataset drives every job stat so the dashboard
  // agrees with the Job Database (which hides PL jobs for base-game runs) and
  // a base-game run can actually reach 100%.
  const availableJobs = jobs.filter(
    (j) => j.meta.expansion === "base" || playthrough.hasPhantomLiberty,
  );
  const categories = allCategoryProgress(availableJobs, jp);
  const overall = overallCompletion(availableJobs, jp);
  const achSummary = achievementSummary(
    achievements.filter((a) => a.expansion === "base" || playthrough.hasPhantomLiberty),
    achProgress ?? [],
  );
  const availableCollectibles = collectibles.filter(
    (c) => c.expansion === "base" || playthrough.hasPhantomLiberty,
  );
  const colSummary = collectibleSummary(availableCollectibles.length, colProgress ?? []);
  const nextJobs = suggestedNextJobs(availableJobs, jp);

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    await db.notes.add({
      id: newId("note"),
      playthroughId: playthrough.id,
      title: noteDraft.trim().slice(0, 120),
      body: noteDraft.trim(),
      pinned: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    setNoteDraft("");
  };

  return (
    <>
      <PageHeader
        readout={`// command center · run ${playthrough.id.slice(-6)}`}
        title={playthrough.name}
        description={playthrough.concept}
        actions={
          <Link
            href="/playthroughs"
            className="clip-chip inline-flex min-h-[44px] items-center border border-line-bright bg-panel-2 px-4 text-sm uppercase tracking-wider text-ink hover:border-holo hover:text-holo"
          >
            Manage runs
          </Link>
        }
      />

      {/* Identity strip */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Lifepath" value={LIFEPATH_LABEL[playthrough.lifepath]} />
        <Stat label="Level" value={String(playthrough.level)} />
        <Stat label="Street Cred" value={String(playthrough.streetCred)} />
        <Stat label="Act" value={`Act ${playthrough.act}`} />
        <Stat
          label="Phantom Liberty"
          value={playthrough.hasPhantomLiberty ? "Installed" : "—"}
          tone={playthrough.hasPhantomLiberty ? "violet" : undefined}
        />
        <Stat label="Status" value={PLAYTHROUGH_STATUS_LABEL[playthrough.status]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Progress sync */}
        <Panel
          readout="// progress sync"
          title="Completion estimate"
          className="lg:col-span-2"
          actions={
            <Link
              href="/jobs"
              className="text-xs uppercase tracking-wider text-holo hover:underline"
            >
              Job database →
            </Link>
          }
        >
          <div className="mb-4 flex items-end gap-3">
            <span className="font-mono text-4xl font-bold text-holo">{overall}%</span>
            <span className="pb-1 text-xs text-ink-faint">
              weighted estimate · starter dataset ({availableJobs.length} tracked jobs)
            </span>
          </div>
          <ProgressBar value={overall} label="Overall completion estimate" className="mb-5" />
          <dl className="grid gap-3 sm:grid-cols-2">
            {categories
              .filter((c) => c.total > 0)
              .map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <dt className="text-xs uppercase tracking-wider text-ink-dim">
                      {JOB_CATEGORY_LABEL[c.category]}
                    </dt>
                    <dd className="font-mono text-xs text-ink-faint">
                      {c.completed}/{c.total}
                    </dd>
                  </div>
                  <ProgressBar
                    value={c.percent}
                    label={`${JOB_CATEGORY_LABEL[c.category]} completion`}
                    tone={c.category === "main" ? "holo" : "lime"}
                  />
                </div>
              ))}
          </dl>
        </Panel>

        {/* Objective queue: custom pins + jobs pinned in the job database */}
        <Panel readout="// objective queue" title="Pinned objectives">
          {(() => {
            const openPins = (pins ?? []).filter((p) => !p.done);
            const pinnedJobs = jp.filter((p) => p.pinned && p.status !== "completed");
            if (openPins.length === 0 && pinnedJobs.length === 0) {
              return (
                <p className="text-sm text-ink-faint">
                  Nothing pinned. Pin jobs from the{" "}
                  <Link href="/jobs" className="text-holo underline underline-offset-2">
                    job database
                  </Link>
                  .
                </p>
              );
            }
            return (
              <ul className="space-y-2">
                {pinnedJobs.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-0.5 text-amber">
                      ⚑
                    </span>
                    <Link
                      href={`/jobs?focus=${encodeURIComponent(p.jobId)}`}
                      className="text-sm text-ink hover:text-holo"
                    >
                      {jobs.find((j) => j.id === p.jobId)?.name ?? p.jobId}
                    </Link>
                  </li>
                ))}
                {openPins.map((pin) => (
                  <li key={pin.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      aria-label={`Mark objective "${pin.label}" done`}
                      className="clip-chip mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-line text-[10px] text-ink-faint hover:border-lime hover:text-lime"
                      onClick={() => void db.pins.update(pin.id, { done: true })}
                    >
                      ✓
                    </button>
                    <span className="text-sm text-ink">{pin.label}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Panel>

        {/* Trackers row */}
        <Panel readout="// accolades" title="Achievements">
          <div className="mb-2 flex items-end justify-between">
            <span className="font-mono text-2xl font-bold text-ink">
              {achSummary.unlocked}
              <span className="text-ink-faint">/{achSummary.total}</span>
            </span>
            <span className="font-mono text-xs text-ink-faint">{achSummary.percent}%</span>
          </div>
          <ProgressBar value={achSummary.percent} label="Achievement completion" tone="violet" />
          <Link
            href="/achievements"
            className="mt-3 inline-block text-xs uppercase tracking-wider text-holo hover:underline"
          >
            Open tracker →
          </Link>
        </Panel>

        <Panel readout="// cache" title="Collections">
          <div className="mb-2 flex items-end justify-between">
            <span className="font-mono text-2xl font-bold text-ink">
              {colSummary.obtained}
              <span className="text-ink-faint">/{colSummary.total}</span>
            </span>
            <span className="font-mono text-xs text-ink-faint">{colSummary.percent}%</span>
          </div>
          <ProgressBar value={colSummary.percent} label="Collectible completion" tone="amber" />
          <Link
            href="/collections"
            className="mt-3 inline-block text-xs uppercase tracking-wider text-holo hover:underline"
          >
            Open collections →
          </Link>
        </Panel>

        {/* Suggested next */}
        <Panel readout="// tactical" title="Suggested next actions">
          {nextJobs.length === 0 ? (
            <p className="text-sm text-ink-faint">All tracked jobs are resolved. Preem work.</p>
          ) : (
            <ul className="space-y-2">
              {nextJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/jobs?focus=${encodeURIComponent(job.id)}`}
                    className="min-w-0 truncate text-sm text-ink hover:text-holo"
                  >
                    {job.name}
                  </Link>
                  <Badge tone={job.category === "main" ? "holo" : "neutral"}>
                    {JOB_CATEGORY_LABEL[job.category]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recently completed */}
        <Panel readout="// log" title="Recently completed" className="lg:col-span-2">
          {(recentJobs ?? []).length === 0 ? (
            <p className="text-sm text-ink-faint">No completed jobs logged yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {(recentJobs ?? []).slice(0, 6).map((p) => {
                const job = jobs.find((j) => j.id === p.jobId);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-ink">{job?.name ?? p.jobId}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                      {p.completedAt?.slice(0, 10) ?? ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Notes */}
        <Panel readout="// intel" title="Quick notes">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void addNote();
            }}
            className="mb-3 flex gap-2"
          >
            <Input
              aria-label="New note"
              placeholder="Log a thought…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <Button type="submit" variant="primary" size="sm" disabled={!noteDraft.trim()}>
              Save
            </Button>
          </form>
          <ul className="space-y-1.5">
            {(notes ?? []).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink-dim">{n.title}</span>
                <button
                  type="button"
                  aria-label={`Delete note "${n.title}"`}
                  className="shrink-0 text-ink-faint hover:text-signal"
                  onClick={() => void db.notes.delete(n.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "violet" }) {
  return (
    <div className="clip-chip border border-line bg-panel px-3 py-2">
      <p className="readout">{label}</p>
      <p
        className={
          tone === "violet" ? "text-sm font-semibold text-violet" : "text-sm font-semibold text-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}
