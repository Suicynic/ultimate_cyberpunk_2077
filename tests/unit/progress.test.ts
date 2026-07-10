import { describe, expect, it } from "vitest";
import {
  achievementPercent,
  achievementSummary,
  allCategoryProgress,
  categoryProgress,
  collectibleSummary,
  overallCompletion,
  suggestedNextJobs,
  unmetPrerequisites,
} from "@/lib/progress";
import type { AchievementDef, JobDef, JobProgress } from "@/types/domain";

const meta = {
  gameVersion: "2.3",
  expansion: "base" as const,
  verification: "community_verified" as const,
  sources: [{ title: "t", url: "https://example.com" }],
};

const job = (id: string, category: JobDef["category"], prerequisites?: string[]): JobDef => ({
  id,
  name: id,
  category,
  missable: false,
  spoilerLevel: "none",
  summarySafe: "x",
  prerequisites,
  meta,
});

const progress = (jobId: string, status: JobProgress["status"]): JobProgress => ({
  id: `run1:${jobId}`,
  playthroughId: "run1",
  jobId,
  status,
  pinned: false,
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("categoryProgress", () => {
  const jobs = [job("job:a", "main"), job("job:b", "main"), job("job:c", "side")];

  it("computes completion percent for a category", () => {
    const result = categoryProgress(jobs, [progress("job:a", "completed")], "main");
    expect(result).toMatchObject({ total: 2, completed: 1, percent: 50 });
  });

  it("counts failed/missed/skipped as closed but not completed", () => {
    const result = categoryProgress(jobs, [progress("job:a", "missed")], "main");
    expect(result.completed).toBe(0);
    expect(result.closed).toBe(1);
  });

  it("returns 0% for an empty category", () => {
    expect(categoryProgress(jobs, [], "gig").percent).toBe(0);
  });

  it("reaches 100% when everything is completed", () => {
    const result = categoryProgress(
      jobs,
      [progress("job:a", "completed"), progress("job:b", "completed")],
      "main",
    );
    expect(result.percent).toBe(100);
  });
});

describe("overallCompletion", () => {
  it("weights main jobs more heavily than gigs", () => {
    const jobs = [job("job:m1", "main"), job("job:g1", "gig")];
    const mainDone = overallCompletion(jobs, [progress("job:m1", "completed")]);
    const gigDone = overallCompletion(jobs, [progress("job:g1", "completed")]);
    expect(mainDone).toBeGreaterThan(gigDone);
  });

  it("is 0 with no progress and 100 when everything completes", () => {
    const jobs = [job("job:m1", "main"), job("job:s1", "side")];
    expect(overallCompletion(jobs, [])).toBe(0);
    expect(
      overallCompletion(jobs, [progress("job:m1", "completed"), progress("job:s1", "completed")]),
    ).toBe(100);
  });
});

describe("allCategoryProgress", () => {
  it("returns one entry per category present in the dataset", () => {
    const jobs = [job("job:a", "main"), job("job:b", "side")];
    expect(
      allCategoryProgress(jobs, [])
        .map((c) => c.category)
        .sort(),
    ).toEqual(["main", "side"]);
  });
});

describe("suggestedNextJobs", () => {
  it("only suggests jobs whose prerequisites are complete", () => {
    const jobs = [job("job:a", "main"), job("job:b", "main", ["job:a"])];
    expect(suggestedNextJobs(jobs, []).map((j) => j.id)).toEqual(["job:a"]);
    expect(suggestedNextJobs(jobs, [progress("job:a", "completed")]).map((j) => j.id)).toEqual([
      "job:b",
    ]);
  });

  it("ranks active jobs before untouched ones", () => {
    const jobs = [job("job:a", "side"), job("job:b", "side")];
    const result = suggestedNextJobs(jobs, [progress("job:b", "active")]);
    expect(result[0]?.id).toBe("job:b");
  });
});

describe("unmetPrerequisites", () => {
  it("lists prerequisites that are not completed", () => {
    const b = job("job:b", "main", ["job:a", "job:c"]);
    expect(unmetPrerequisites(b, [progress("job:a", "completed")])).toEqual(["job:c"]);
  });
});

describe("achievements", () => {
  const bool: AchievementDef = {
    id: "ach:x",
    name: "X",
    platforms: ["pc_steam"],
    expansion: "base",
    descriptionPublic: "d",
    isSecret: false,
    progressModel: { type: "boolean" },
    missable: false,
    spoilerLevel: "none",
    meta,
  };
  const count: AchievementDef = {
    ...bool,
    id: "ach:y",
    progressModel: { type: "count", target: 20 },
  };
  const checklist: AchievementDef = {
    ...bool,
    id: "ach:z",
    progressModel: {
      type: "checklist",
      steps: [
        { id: "s1", label: "one" },
        { id: "s2", label: "two" },
      ],
    },
  };

  it("summarizes unlocked and in-progress achievements", () => {
    const summary = achievementSummary(
      [bool, count],
      [
        {
          id: "r:ach:x",
          playthroughId: "r",
          achievementId: "ach:x",
          state: "unlocked",
          updatedAt: "",
        },
        {
          id: "r:ach:y",
          playthroughId: "r",
          achievementId: "ach:y",
          state: "in_progress",
          count: 5,
          updatedAt: "",
        },
      ],
    );
    expect(summary).toMatchObject({ total: 2, unlocked: 1, inProgress: 1, percent: 50 });
  });

  it("computes count-based percent and clamps overflow", () => {
    expect(
      achievementPercent(count, {
        id: "r:ach:y",
        playthroughId: "r",
        achievementId: "ach:y",
        state: "in_progress",
        count: 10,
        updatedAt: "",
      }),
    ).toBe(50);
    expect(
      achievementPercent(count, {
        id: "r:ach:y",
        playthroughId: "r",
        achievementId: "ach:y",
        state: "in_progress",
        count: 999,
        updatedAt: "",
      }),
    ).toBe(100);
  });

  it("computes checklist percent ignoring unknown step ids", () => {
    expect(
      achievementPercent(checklist, {
        id: "r:ach:z",
        playthroughId: "r",
        achievementId: "ach:z",
        state: "in_progress",
        steps: ["s1", "bogus"],
        updatedAt: "",
      }),
    ).toBe(50);
  });

  it("returns 100 for unlocked regardless of model", () => {
    expect(
      achievementPercent(bool, {
        id: "r:ach:x",
        playthroughId: "r",
        achievementId: "ach:x",
        state: "unlocked",
        updatedAt: "",
      }),
    ).toBe(100);
  });
});

describe("collectibleSummary", () => {
  it("counts obtained-family states only", () => {
    const rows = (
      [
        ["c1", "obtained"],
        ["c2", "equipped"],
        ["c3", "missed"],
        ["c4", "not_obtained"],
      ] as const
    ).map(([cid, state]) => ({
      id: `r:${cid}`,
      playthroughId: "r",
      collectibleId: cid,
      state,
      updatedAt: "",
    }));
    expect(collectibleSummary(4, rows)).toEqual({ total: 4, obtained: 2, percent: 50 });
  });
});

describe("expansion-filtered completion (base-game runs)", () => {
  it("a base-game run reaches 100% when all base jobs are done", async () => {
    const { jobs } = await import("@/data/jobs");
    const baseJobs = jobs.filter((j) => j.meta.expansion === "base");
    const progress: JobProgress[] = baseJobs.map((j) => ({
      id: `run:${j.id}`,
      playthroughId: "run",
      jobId: j.id,
      status: "completed",
      pinned: false,
      updatedAt: "",
    }));
    // Dashboards must compute over the expansion-filtered set, not the full
    // dataset — otherwise unreachable Phantom Liberty jobs cap a base run below 100%.
    expect(overallCompletion(baseJobs, progress)).toBe(100);
    // Sanity: the full dataset would NOT reach 100% with the same progress.
    expect(overallCompletion(jobs, progress)).toBeLessThan(100);
  });
});
