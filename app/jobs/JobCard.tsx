"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { Badge, Field, Textarea } from "@/components/ui";
import { jobById } from "@/data/jobs";
import { db } from "@/lib/database/db";
import { setJobNotes, setJobStatus, toggleJobPinned } from "@/lib/database/repo";
import { DISTRICT_LABEL, JOB_CATEGORY_LABEL, JOB_STATUS_LABEL } from "@/lib/labels";
import { unmetPrerequisites } from "@/lib/progress";
import type { JobDef, JobProgress, JobStatus } from "@/types/domain";

export function JobCard({
  job,
  progress,
  playthroughId,
  focused,
}: {
  job: JobDef;
  progress: JobProgress | undefined;
  playthroughId: string;
  focused: boolean;
}) {
  const [expanded, setExpanded] = React.useState(focused);

  // --- Notes hydration (issue #3) ------------------------------------------
  // `progress` is delivered by the parent's `useLiveQuery`, which resolves
  // asynchronously (undefined → loaded). Because the card is keyed
  // `${playthrough.id}:${job.id}` it does *not* remount when that row arrives,
  // so the notes draft cannot simply be seeded once at mount — it would be
  // stuck on the empty first-render value. Instead we reconcile the persisted
  // value into the draft during render (React's recommended alternative to an
  // effect for prop-derived state), guarding against clobbering a live edit.
  //
  // State-synchronization rule: adopt a newly delivered persisted value only
  // when the draft is *clean* (no unsaved edits) and the field is *not
  // focused*. This lets a late Dexie result — or an external write — hydrate an
  // untouched field, while guaranteeing an in-progress edit is never
  // overwritten by an asynchronous query result.
  const persistedNotes = progress?.notes ?? "";
  const [notesDraft, setNotesDraft] = React.useState(persistedNotes);
  // The persisted value the current draft has been reconciled against. Tracking
  // it lets us detect a *changed* persisted value across renders without an
  // effect, and lets us tell a clean draft (draft === synced) from a dirty one.
  const [syncedNotes, setSyncedNotes] = React.useState(persistedNotes);
  const [notesFocused, setNotesFocused] = React.useState(false);

  if (persistedNotes !== syncedNotes) {
    const dirty = notesDraft !== syncedNotes;
    // Clean but focused → defer adoption until blur so text never shifts under
    // the caret; leave `syncedNotes` pending so the blur re-render still adopts.
    const deferUntilBlur = !dirty && notesFocused;
    if (!deferUntilBlur) setSyncedNotes(persistedNotes);
    if (!dirty && !notesFocused) setNotesDraft(persistedNotes);
  }

  const status = progress?.status ?? "available";
  const allProgress = useLiveQuery(
    () => db.jobProgress.where("playthroughId").equals(playthroughId).toArray(),
    [playthroughId],
  );
  const unmet = unmetPrerequisites(job, allProgress ?? []);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: "center" });
    }
  }, [focused]);

  return (
    <article
      ref={ref}
      className={`clip-panel border bg-panel ${focused ? "border-holo" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-label={progress?.pinned ? `Unpin ${job.name}` : `Pin ${job.name}`}
          aria-pressed={progress?.pinned ?? false}
          className={`clip-chip flex h-9 w-9 shrink-0 items-center justify-center border text-sm ${
            progress?.pinned
              ? "border-amber text-amber"
              : "border-line text-ink-faint hover:border-amber hover:text-amber"
          }`}
          onClick={() => void toggleJobPinned(playthroughId, job.id)}
        >
          ⚑
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className="block truncate text-sm font-semibold text-ink hover:text-holo">
            {job.name}
          </span>
          <span className="readout block">
            {JOB_CATEGORY_LABEL[job.category]}
            {job.district ? ` · ${DISTRICT_LABEL[job.district]}` : ""}
            {job.questGiver ? ` · ${job.questGiver}` : ""}
          </span>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {job.missable && <Badge tone="amber">Missable</Badge>}
          {job.pointOfNoReturn && <Badge tone="signal">Point of no return</Badge>}
          {job.meta.expansion === "phantom_liberty" && <Badge tone="violet">PL</Badge>}
          <label className="sr-only" htmlFor={`status-${job.id}`}>
            Status for {job.name}
          </label>
          <select
            id={`status-${job.id}`}
            value={status}
            onChange={(e) => void setJobStatus(playthroughId, job.id, e.target.value as JobStatus)}
            className={`clip-chip min-h-[36px] border bg-panel-2 px-2 py-1 font-mono text-[11px] uppercase tracking-wider ${
              status === "completed"
                ? "border-lime/60 text-lime"
                : status === "active"
                  ? "border-amber/60 text-amber"
                  : "border-line text-ink-dim"
            }`}
          >
            {Object.entries(JOB_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-sm text-ink-dim">{job.summarySafe}</p>
          {job.summarySpoiler && (
            <SpoilerShield
              level={job.spoilerLevel}
              revealKey={job.id}
              label="Outcome & decision intel"
            >
              <p className="mb-2 border-l-2 border-holo/50 pl-3 text-sm text-ink-dim">
                {job.summarySpoiler}
              </p>
            </SpoilerShield>
          )}

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              {(job.prerequisites?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="readout mb-1">Prerequisites</p>
                  <ul className="space-y-1">
                    {job.prerequisites?.map((pid) => {
                      const met = !unmet.includes(pid);
                      return (
                        <li key={pid} className="flex items-center gap-2 text-xs">
                          <span aria-hidden="true" className={met ? "text-lime" : "text-ink-faint"}>
                            {met ? "✓" : "○"}
                          </span>
                          <span className={met ? "text-ink-dim" : "text-ink"}>
                            {jobById.get(pid)?.name ?? pid}
                          </span>
                          <span className="sr-only">{met ? "(completed)" : "(not completed)"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {job.recommendedLevel && (
                <p className="mb-2 text-xs text-ink-faint">
                  Recommended level: {job.recommendedLevel}
                </p>
              )}
              <SourceList meta={job.meta} />
            </div>
            <div>
              <Field label="Personal notes & decisions" htmlFor={`notes-${job.id}`}>
                <Textarea
                  id={`notes-${job.id}`}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onFocus={() => setNotesFocused(true)}
                  onBlur={() => {
                    setNotesFocused(false);
                    // Persist only a genuine user edit — the draft diverging from
                    // the reconciliation baseline. Comparing against `syncedNotes`
                    // (not `persistedNotes`) means a persisted value that changed
                    // while the field was focused-but-untouched is adopted on the
                    // post-blur render instead of being clobbered by a stale draft.
                    if (notesDraft !== syncedNotes) {
                      void setJobNotes(playthroughId, job.id, notesDraft);
                    }
                  }}
                  placeholder="What did you choose? What happened?"
                />
              </Field>
              <p className="mt-1 text-[11px] text-ink-faint">
                Notes save when you click away. For structured decision logging, use the{" "}
                <Link href="/endings" className="text-holo underline underline-offset-2">
                  decision journal
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
