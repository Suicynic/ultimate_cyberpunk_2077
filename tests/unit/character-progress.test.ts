import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database/db";
import {
  createPlaythrough,
  deletePlaythrough,
  duplicatePlaythrough,
  setCharacterProgress,
} from "@/lib/database/repo";
import { exportToJson, importFromJson } from "@/lib/import-export";
import { progressId } from "@/lib/ids";

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

describe("character progress", () => {
  it("records an encounter and preserves it when notes are added", async () => {
    const run = await makeRun("Run");
    await setCharacterProgress(run.id, "character:panam-palmer", { encountered: true });
    await setCharacterProgress(run.id, "character:panam-palmer", { notes: "Met in the Badlands" });

    const row = await db.characterProgress.get(progressId(run.id, "character:panam-palmer"));
    expect(row?.encountered).toBe(true);
    expect(row?.notes).toBe("Met in the Badlands");
  });

  it("keeps character progress isolated between runs", async () => {
    const a = await makeRun("A");
    const b = await makeRun("B");
    await setCharacterProgress(a.id, "character:jackie-welles", { notes: "A note" });
    await setCharacterProgress(b.id, "character:jackie-welles", { notes: "B note" });
    expect(
      (await db.characterProgress.get(progressId(a.id, "character:jackie-welles")))?.notes,
    ).toBe("A note");
    expect(
      (await db.characterProgress.get(progressId(b.id, "character:jackie-welles")))?.notes,
    ).toBe("B note");
  });

  it("duplicates character progress into a forked run", async () => {
    const run = await makeRun("Original");
    await setCharacterProgress(run.id, "character:judy-alvarez", { encountered: true });
    const copy = await duplicatePlaythrough(run.id);
    expect(copy).toBeDefined();
    const copied = await db.characterProgress.where("playthroughId").equals(copy!.id).toArray();
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({ characterId: "character:judy-alvarez", encountered: true });
  });

  it("removes character progress when its run is deleted", async () => {
    const a = await makeRun("Doomed");
    const b = await makeRun("Survivor");
    await setCharacterProgress(a.id, "character:v", { encountered: true });
    await deletePlaythrough(a.id);
    expect(await db.characterProgress.where("playthroughId").equals(a.id).count()).toBe(0);
    // Survivor untouched.
    expect(b).toBeDefined();
  });

  it("round-trips character progress through export/import", async () => {
    const run = await makeRun("Export");
    await setCharacterProgress(run.id, "character:river-ward", {
      encountered: true,
      notes: "helped the family",
    });
    const json = await exportToJson();

    await Promise.all(db.tables.map((t) => t.clear()));
    const result = await importFromJson(json, "replace");
    expect(result.ok).toBe(true);
    const rows = await db.characterProgress.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      characterId: "character:river-ward",
      encountered: true,
      notes: "helped the family",
    });
  });
});
