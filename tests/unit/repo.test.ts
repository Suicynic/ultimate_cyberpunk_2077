import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database/db";
import {
  createPlaythrough,
  deletePlaythrough,
  duplicatePlaythrough,
  getSettings,
  revealSpoiler,
  setActivePlaythrough,
  setJobStatus,
  toggleJobPinned,
  updateSettings,
} from "@/lib/database/repo";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("playthrough lifecycle", () => {
  it("creates a playthrough with defaults and activates the first one", async () => {
    const run = await createPlaythrough({
      name: "First",
      lifepath: "nomad",
      difficulty: "normal",
      platform: "pc_steam",
      hasPhantomLiberty: true,
    });
    expect(run.level).toBe(1);
    expect(run.status).toBe("active");
    const settings = await getSettings();
    expect(settings.activePlaythroughId).toBe(run.id);
  });

  it("switches the active playthrough", async () => {
    const a = await createPlaythrough({
      name: "A",
      lifepath: "corpo",
      difficulty: "normal",
      platform: "pc_steam",
      hasPhantomLiberty: false,
    });
    const b = await createPlaythrough({
      name: "B",
      lifepath: "streetkid",
      difficulty: "hard",
      platform: "xbox",
      hasPhantomLiberty: true,
    });
    expect((await getSettings()).activePlaythroughId).toBe(a.id);
    await setActivePlaythrough(b.id);
    expect((await getSettings()).activePlaythroughId).toBe(b.id);
  });

  it("duplicates a run including its job progress", async () => {
    const run = await createPlaythrough({
      name: "Original",
      lifepath: "nomad",
      difficulty: "normal",
      platform: "pc_steam",
      hasPhantomLiberty: true,
    });
    await setJobStatus(run.id, "job:the-rescue", "completed");
    const copy = await duplicatePlaythrough(run.id);
    expect(copy?.name).toBe("Original (copy)");
    const copiedProgress = await db.jobProgress.where("playthroughId").equals(copy!.id).toArray();
    expect(copiedProgress).toHaveLength(1);
    expect(copiedProgress[0]).toMatchObject({ jobId: "job:the-rescue", status: "completed" });
  });

  it("deletes a run and all owned records, moving the active pointer", async () => {
    const a = await createPlaythrough({
      name: "Doomed",
      lifepath: "corpo",
      difficulty: "easy",
      platform: "pc_gog",
      hasPhantomLiberty: false,
    });
    const b = await createPlaythrough({
      name: "Survivor",
      lifepath: "nomad",
      difficulty: "easy",
      platform: "pc_gog",
      hasPhantomLiberty: false,
    });
    await setJobStatus(a.id, "job:the-rescue", "completed");
    await deletePlaythrough(a.id);
    expect(await db.playthroughs.count()).toBe(1);
    expect(await db.jobProgress.where("playthroughId").equals(a.id).count()).toBe(0);
    expect((await getSettings()).activePlaythroughId).toBe(b.id);
  });
});

describe("job progress", () => {
  it("updates status and stamps completedAt on completion", async () => {
    const run = await createPlaythrough({
      name: "R",
      lifepath: "nomad",
      difficulty: "normal",
      platform: "pc_steam",
      hasPhantomLiberty: true,
    });
    await setJobStatus(run.id, "job:the-pickup", "active");
    let row = await db.jobProgress.get(`${run.id}:job:the-pickup`);
    expect(row?.status).toBe("active");
    expect(row?.completedAt).toBeUndefined();

    await setJobStatus(run.id, "job:the-pickup", "completed");
    row = await db.jobProgress.get(`${run.id}:job:the-pickup`);
    expect(row?.status).toBe("completed");
    expect(row?.completedAt).toBeTruthy();
  });

  it("toggles pinned state without clobbering status", async () => {
    const run = await createPlaythrough({
      name: "R",
      lifepath: "nomad",
      difficulty: "normal",
      platform: "pc_steam",
      hasPhantomLiberty: true,
    });
    await setJobStatus(run.id, "job:the-heist", "active");
    await toggleJobPinned(run.id, "job:the-heist");
    const row = await db.jobProgress.get(`${run.id}:job:the-heist`);
    expect(row).toMatchObject({ status: "active", pinned: true });
  });
});

describe("settings", () => {
  it("persists spoiler mode and reveals", async () => {
    await updateSettings({ spoilerMode: "hide_all" });
    await revealSpoiler("job:the-heist");
    await revealSpoiler("job:the-heist"); // idempotent
    const settings = await getSettings();
    expect(settings.spoilerMode).toBe("hide_all");
    expect(settings.revealedSpoilers).toEqual(["job:the-heist"]);
  });
});
