import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database/db";
import {
  createPlaythrough,
  deletePlaythrough,
  duplicatePlaythrough,
  getSettings,
  revealSpoiler,
  setActivePlaythrough,
  setJobNotes,
  setJobStatus,
  setPlaythroughArchived,
  toggleJobPinned,
  updateSettings,
} from "@/lib/database/repo";
import { newId, nowIso } from "@/lib/ids";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const makeRun = (name: string) =>
  createPlaythrough({
    name,
    lifepath: "nomad",
    difficulty: "normal",
    platform: "pc_steam",
    hasPhantomLiberty: true,
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

  it("duplicates a run as a complete, independent fork (decisions, notes, builds)", async () => {
    const run = await makeRun("Fork Source");
    await setJobStatus(run.id, "job:the-rescue", "completed");
    await db.decisions.add({
      id: newId("dec"),
      playthroughId: run.id,
      title: "Sided with Panam",
      choice: "left with the nomads",
      spoilerLevel: "major",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await db.notes.add({
      id: newId("note"),
      playthroughId: run.id,
      title: "Reminder",
      body: "Grab Skippy before The Heist",
      pinned: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await db.builds.add({
      id: newId("build"),
      playthroughId: run.id,
      name: "Netrunner",
      gameVersion: "2.3",
      targetLevel: 50,
      attributes: { body: 3, reflexes: 3, technical_ability: 3, intelligence: 20, cool: 3 },
      perks: {},
      relicPerks: [],
      equipment: { weapons: [], cyberware: [], quickhacks: [], clothing: [], vehicles: [] },
      tags: ["Netrunner"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    const copy = await duplicatePlaythrough(run.id);
    expect(copy).toBeDefined();
    const [decisions, notes, builds] = await Promise.all([
      db.decisions.where("playthroughId").equals(copy!.id).toArray(),
      db.notes.where("playthroughId").equals(copy!.id).toArray(),
      db.builds.where("playthroughId").equals(copy!.id).toArray(),
    ]);
    expect(decisions).toHaveLength(1);
    expect(notes).toHaveLength(1);
    expect(builds).toHaveLength(1);
    // The fork owns fresh IDs — the originals are untouched.
    expect(decisions[0]!.id).not.toBe(run.id);
    expect(await db.decisions.where("playthroughId").equals(run.id).count()).toBe(1);
  });

  it("archiving the active run moves the active pointer to a visible run", async () => {
    const a = await makeRun("Active");
    const b = await makeRun("Standby");
    await setActivePlaythrough(a.id);
    await setPlaythroughArchived(a.id, true);
    expect((await getSettings()).activePlaythroughId).toBe(b.id);
    expect((await db.playthroughs.get(a.id))?.archived).toBe(true);
  });

  it("archiving the only run clears the active pointer", async () => {
    const a = await makeRun("Lonely");
    await setActivePlaythrough(a.id);
    await setPlaythroughArchived(a.id, true);
    expect((await getSettings()).activePlaythroughId).toBeUndefined();
  });

  it("keeps job notes isolated between two runs", async () => {
    const a = await makeRun("Run A");
    const b = await makeRun("Run B");
    await setJobNotes(a.id, "job:the-heist", "A: send body to family");
    await setJobNotes(b.id, "job:the-heist", "B: keep the body");
    expect((await db.jobProgress.get(`${a.id}:job:the-heist`))?.notes).toBe(
      "A: send body to family",
    );
    expect((await db.jobProgress.get(`${b.id}:job:the-heist`))?.notes).toBe("B: keep the body");
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
