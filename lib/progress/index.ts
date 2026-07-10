import type {
  AchievementDef,
  AchievementProgress,
  CollectibleProgress,
  JobCategory,
  JobDef,
  JobProgress,
  JobStatus,
} from "@/types/domain";

/**
 * Pure progress calculations. No I/O — everything here is unit-tested.
 */

/** Statuses that count as "resolved" for completion percentages. */
const DONE_STATUSES: ReadonlySet<JobStatus> = new Set(["completed"]);
/** Statuses that no longer count toward the remaining pool. */
const CLOSED_STATUSES: ReadonlySet<JobStatus> = new Set([
  "completed",
  "failed",
  "missed",
  "skipped",
]);

export interface CategoryProgress {
  category: JobCategory;
  total: number;
  completed: number;
  closed: number;
  percent: number;
}

export function jobStatusFor(
  progress: readonly JobProgress[],
  jobId: string,
): JobStatus | undefined {
  return progress.find((p) => p.jobId === jobId)?.status;
}

export function categoryProgress(
  jobs: readonly JobDef[],
  progress: readonly JobProgress[],
  category: JobCategory,
): CategoryProgress {
  const inCategory = jobs.filter((j) => j.category === category);
  const byJob = new Map(progress.map((p) => [p.jobId, p.status]));
  let completed = 0;
  let closed = 0;
  for (const job of inCategory) {
    const status = byJob.get(job.id);
    if (status && DONE_STATUSES.has(status)) completed += 1;
    if (status && CLOSED_STATUSES.has(status)) closed += 1;
  }
  const total = inCategory.length;
  return {
    category,
    total,
    completed,
    closed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function allCategoryProgress(
  jobs: readonly JobDef[],
  progress: readonly JobProgress[],
): CategoryProgress[] {
  const categories = [...new Set(jobs.map((j) => j.category))];
  return categories.map((c) => categoryProgress(jobs, progress, c));
}

/**
 * Weighted overall completion estimate across job categories.
 * Weights are editorial (main story counts more than repeatable activities)
 * and clearly labeled as an estimate in the UI.
 */
const CATEGORY_WEIGHTS: Partial<Record<JobCategory, number>> = {
  main: 4,
  side: 3,
  romance: 2,
  companion: 2,
  ending: 1,
  gig: 2,
  ncpd: 1,
  cyberpsycho: 1,
};

export function overallCompletion(
  jobs: readonly JobDef[],
  progress: readonly JobProgress[],
): number {
  let weightTotal = 0;
  let weighted = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS) as [JobCategory, number][]) {
    const cp = categoryProgress(jobs, progress, category);
    if (cp.total === 0) continue;
    weightTotal += weight;
    weighted += (cp.completed / cp.total) * weight;
  }
  return weightTotal === 0 ? 0 : Math.round((weighted / weightTotal) * 100);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export interface AchievementSummary {
  total: number;
  unlocked: number;
  inProgress: number;
  percent: number;
}

export function achievementSummary(
  defs: readonly AchievementDef[],
  progress: readonly AchievementProgress[],
): AchievementSummary {
  const byId = new Map(progress.map((p) => [p.achievementId, p]));
  let unlocked = 0;
  let inProgress = 0;
  for (const def of defs) {
    const row = byId.get(def.id);
    if (row?.state === "unlocked") unlocked += 1;
    else if (row?.state === "in_progress") inProgress += 1;
  }
  return {
    total: defs.length,
    unlocked,
    inProgress,
    percent: defs.length === 0 ? 0 : Math.round((unlocked / defs.length) * 100),
  };
}

/** Percent complete for a single achievement, respecting its progress model. */
export function achievementPercent(
  def: AchievementDef,
  progress: AchievementProgress | undefined,
): number {
  if (progress?.state === "unlocked") return 100;
  switch (def.progressModel.type) {
    case "boolean":
      return 0;
    case "percent":
      return Math.min(100, Math.max(0, progress?.count ?? 0));
    case "count": {
      const target = def.progressModel.target;
      const count = Math.min(progress?.count ?? 0, target);
      return target === 0 ? 0 : Math.round((count / target) * 100);
    }
    case "checklist": {
      // Capture the narrowed steps before the closure (narrowing is lost inside callbacks).
      const stepDefs = def.progressModel.steps;
      const done = (progress?.steps ?? []).filter((s) =>
        stepDefs.some((step) => step.id === s),
      ).length;
      return stepDefs.length === 0 ? 0 : Math.round((done / stepDefs.length) * 100);
    }
  }
}

// ---------------------------------------------------------------------------
// Collectibles
// ---------------------------------------------------------------------------

export function collectibleSummary(
  totalDefs: number,
  progress: readonly CollectibleProgress[],
): { total: number; obtained: number; percent: number } {
  const obtained = progress.filter((p) =>
    ["obtained", "upgraded", "stored", "equipped"].includes(p.state),
  ).length;
  return {
    total: totalDefs,
    obtained,
    percent: totalDefs === 0 ? 0 : Math.round((obtained / totalDefs) * 100),
  };
}

// ---------------------------------------------------------------------------
// Job dependency helpers
// ---------------------------------------------------------------------------

/** Jobs whose prerequisites are all completed but are not yet closed. */
export function suggestedNextJobs(
  jobs: readonly JobDef[],
  progress: readonly JobProgress[],
  limit = 5,
): JobDef[] {
  const byJob = new Map(progress.map((p) => [p.jobId, p.status]));
  const ready = jobs.filter((job) => {
    const status = byJob.get(job.id);
    if (status && CLOSED_STATUSES.has(status)) return false;
    const prereqs = job.prerequisites ?? [];
    return prereqs.every((p) => {
      const s = byJob.get(p);
      return s !== undefined && DONE_STATUSES.has(s);
    });
  });
  // Actives first, then available, then untouched; mains before the rest.
  const rank = (job: JobDef) => {
    const status = byJob.get(job.id);
    const statusRank = status === "active" ? 0 : status === "available" ? 1 : 2;
    const categoryRank = job.category === "main" ? 0 : 1;
    return statusRank * 10 + categoryRank;
  };
  return [...ready].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

/** Unmet prerequisites for a job, for dependency display. */
export function unmetPrerequisites(job: JobDef, progress: readonly JobProgress[]): string[] {
  const byJob = new Map(progress.map((p) => [p.jobId, p.status]));
  return (job.prerequisites ?? []).filter((p) => {
    const s = byJob.get(p);
    return !(s !== undefined && DONE_STATUSES.has(s));
  });
}
