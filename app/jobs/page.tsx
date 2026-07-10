"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { JobCard } from "@/app/jobs/JobCard";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Panel,
  ProgressBar,
  Select,
  type Tone,
} from "@/components/ui";
import { jobs } from "@/data/jobs";
import { db } from "@/lib/database/db";
import { setJobStatus } from "@/lib/database/repo";
import { useActivePlaythrough, useSettings, useSpoilerGuard } from "@/lib/hooks";
import { JOB_CATEGORY_LABEL, JOB_STATUS_LABEL } from "@/lib/labels";
import { categoryProgress } from "@/lib/progress";
import type { JobCategory, JobDef, JobStatus } from "@/types/domain";

const STATUS_TONE: Record<JobStatus, Tone> = {
  locked: "neutral",
  available: "holo",
  active: "amber",
  completed: "lime",
  failed: "signal",
  missed: "signal",
  skipped: "neutral",
};

const CATEGORY_FILTERS: { value: JobCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "main", label: "Main" },
  { value: "side", label: "Side" },
  { value: "gig", label: "Gigs" },
  { value: "ncpd", label: "NCPD" },
  { value: "cyberpsycho", label: "Cyberpsychos" },
  { value: "romance", label: "Romance" },
  { value: "ending", label: "Endings" },
];

export default function JobsPage() {
  return (
    <React.Suspense fallback={null}>
      <JobsPageInner />
    </React.Suspense>
  );
}

function JobsPageInner() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();
  const guard = useSpoilerGuard();
  const params = useSearchParams();
  const focusId = params.get("focus");

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<JobCategory | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<JobStatus | "all" | "open">("all");
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const progress = useLiveQuery(
    async () =>
      playthrough ? db.jobProgress.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );

  if (!playthrough) {
    return (
      <>
        <PageHeader readout="// job database" title="Job Database" />
        <EmptyState
          title="No active run"
          body="Create a playthrough first — job progress is tracked per run."
          action={
            <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
              Create one now →
            </Link>
          }
        />
      </>
    );
  }

  const progressByJob = new Map((progress ?? []).map((p) => [p.jobId, p]));

  const visibleJobs = jobs
    .filter((j) => j.meta.expansion === "base" || playthrough.hasPhantomLiberty)
    .filter((j) => category === "all" || j.category === category)
    .filter((j) => {
      const st = progressByJob.get(j.id)?.status ?? "available";
      if (statusFilter === "all") return true;
      if (statusFilter === "open")
        return !["completed", "failed", "missed", "skipped"].includes(st);
      return st === statusFilter;
    })
    .filter((j) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      // Never match on shielded spoiler text.
      const shielded = guard(j.spoilerLevel, j.id);
      return (
        j.name.toLowerCase().includes(q) ||
        (j.questGiver?.toLowerCase().includes(q) ?? false) ||
        (j.questline?.toLowerCase().includes(q) ?? false) ||
        (!shielded && (j.summarySpoiler?.toLowerCase().includes(q) ?? false)) ||
        j.summarySafe.toLowerCase().includes(q)
      );
    });

  const grouped = new Map<string, JobDef[]>();
  for (const job of visibleJobs) {
    const key = job.questline ?? JOB_CATEGORY_LABEL[job.category];
    grouped.set(key, [...(grouped.get(key) ?? []), job]);
  }

  const mainProgress = categoryProgress(jobs, progress ?? [], "main");

  const applyBulk = async (status: JobStatus) => {
    await Promise.all([...selected].map((jobId) => setJobStatus(playthrough.id, jobId, status)));
    setSelected(new Set());
    setBulkMode(false);
  };

  return (
    <>
      <PageHeader
        readout={`// job database · ${jobs.length} records (starter set)`}
        title={settings.conventionalLabels ? "Quest Tracker" : "Job Database"}
        description="Representative starter dataset — every record carries sources and a verification status. Quest outcomes are never reduced to a single 'correct' choice."
        actions={
          <div className="flex items-center gap-3">
            <div className="w-40">
              <p className="readout mb-1">Main jobs {mainProgress.percent}%</p>
              <ProgressBar value={mainProgress.percent} label="Main job completion" />
            </div>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <Input
            id="job-search"
            type="search"
            placeholder="Search jobs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={category === f.value}
              onClick={() => setCategory(f.value)}
              className={`clip-chip min-h-[36px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                category === f.value
                  ? "border-holo bg-panel-3 text-holo"
                  : "border-line text-ink-dim hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <Select
          id="status-filter"
          className="!w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as JobStatus | "all" | "open")}
        >
          <option value="all">Any status</option>
          <option value="open">Open (not resolved)</option>
          {Object.entries(JOB_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button size="sm" aria-pressed={bulkMode} onClick={() => setBulkMode(!bulkMode)}>
          {bulkMode ? "Exit bulk mode" : "Bulk update"}
        </Button>
      </div>

      {bulkMode && (
        <Panel readout="// bulk operations" title={`${selected.size} selected`} className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSelected(new Set(visibleJobs.map((j) => j.id)))}>
              Select all visible
            </Button>
            <Button size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={selected.size === 0}
              onClick={() => void applyBulk("completed")}
            >
              Mark completed
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => void applyBulk("available")}
            >
              Mark available
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => void applyBulk("skipped")}
            >
              Mark skipped
            </Button>
          </div>
        </Panel>
      )}

      {visibleJobs.length === 0 ? (
        <EmptyState title="No jobs match the current filters" />
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([groupName, groupJobs]) => (
            <section key={groupName} aria-label={groupName}>
              <h2 className="readout mb-2 !text-ink-dim">
                {groupName} ·{" "}
                {groupJobs.filter((j) => progressByJob.get(j.id)?.status === "completed").length}/
                {groupJobs.length}
              </h2>
              <div className="space-y-2">
                {groupJobs.map((job) =>
                  bulkMode ? (
                    <label
                      key={job.id}
                      className="clip-chip flex min-h-[44px] cursor-pointer items-center gap-3 border border-line bg-panel px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#58e6d9]"
                        checked={selected.has(job.id)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(job.id);
                          else next.delete(job.id);
                          setSelected(next);
                        }}
                      />
                      <span className="text-sm text-ink">{job.name}</span>
                      <Badge
                        tone={STATUS_TONE[progressByJob.get(job.id)?.status ?? "available"]}
                        className="ml-auto"
                      >
                        {JOB_STATUS_LABEL[progressByJob.get(job.id)?.status ?? "available"]}
                      </Badge>
                    </label>
                  ) : (
                    <JobCard
                      // Include the run ID so switching playthroughs remounts
                      // the card and re-seeds its notes draft from the new run.
                      key={`${playthrough.id}:${job.id}`}
                      job={job}
                      progress={progressByJob.get(job.id)}
                      playthroughId={playthrough.id}
                      focused={focusId === job.id}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
