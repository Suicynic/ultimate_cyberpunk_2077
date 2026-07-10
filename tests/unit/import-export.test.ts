import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/database/db";
import { createPlaythrough, setJobStatus } from "@/lib/database/repo";
import { buildExportEnvelope, exportToJson, importFromJson } from "@/lib/import-export";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("export", () => {
  it("captures playthroughs and progress in the envelope", async () => {
    const run = await createPlaythrough({
      name: "V-Test",
      lifepath: "nomad",
      difficulty: "hard",
      platform: "pc_gog",
      hasPhantomLiberty: true,
    });
    await setJobStatus(run.id, "job:the-rescue", "completed");

    const envelope = await buildExportEnvelope();
    expect(envelope.app).toBe("ultimate-cyberpunk-2077");
    expect(envelope.data.playthroughs).toHaveLength(1);
    expect(envelope.data.jobProgress).toHaveLength(1);
    expect(envelope.data.jobProgress[0]).toMatchObject({
      jobId: "job:the-rescue",
      status: "completed",
    });
  });
});

describe("import", () => {
  it("round-trips exported data (replace mode)", async () => {
    const run = await createPlaythrough({
      name: "Round Trip",
      lifepath: "corpo",
      difficulty: "normal",
      platform: "playstation",
      hasPhantomLiberty: false,
    });
    await setJobStatus(run.id, "job:the-rescue", "active");
    const json = await exportToJson();

    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.playthroughs.count()).toBe(0);

    const result = await importFromJson(json, "replace");
    expect(result.ok).toBe(true);
    expect(await db.playthroughs.count()).toBe(1);
    const restored = await db.playthroughs.toCollection().first();
    expect(restored?.name).toBe("Round Trip");
    expect(await db.jobProgress.count()).toBe(1);
  });

  it("merge mode keeps existing rows", async () => {
    await createPlaythrough({
      name: "Existing",
      lifepath: "streetkid",
      difficulty: "easy",
      platform: "xbox",
      hasPhantomLiberty: false,
    });
    const json = await exportToJson();
    await createPlaythrough({
      name: "Second",
      lifepath: "nomad",
      difficulty: "easy",
      platform: "xbox",
      hasPhantomLiberty: false,
    });
    const result = await importFromJson(json, "merge");
    expect(result.ok).toBe(true);
    // Existing (re-imported, same ID) + Second
    expect(await db.playthroughs.count()).toBe(2);
  });

  it("rejects non-JSON input without writing", async () => {
    const result = await importFromJson("not json at all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not valid JSON/i);
    expect(await db.playthroughs.count()).toBe(0);
  });

  it("rejects JSON that fails the schema", async () => {
    const result = await importFromJson(
      JSON.stringify({ app: "something-else", schemaVersion: 1, exportedAt: "", data: {} }),
    );
    expect(result.ok).toBe(false);
    expect(await db.playthroughs.count()).toBe(0);
  });

  it("rejects exports from a newer schema version", async () => {
    const envelope = await buildExportEnvelope();
    const tampered = { ...envelope, schemaVersion: 999 };
    const result = await importFromJson(JSON.stringify(tampered));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/schema v999/);
  });

  it("rejects payloads with invalid rows", async () => {
    const bad = {
      app: "ultimate-cyberpunk-2077",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        playthroughs: [{ id: "x", name: "" }],
        jobProgress: [],
        achievementProgress: [],
        collectibleProgress: [],
        markerProgress: [],
        customMarkers: [],
        decisions: [],
        endingProgress: [],
        relationshipProgress: [],
        builds: [],
        notes: [],
        pins: [],
      },
    };
    const result = await importFromJson(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    expect(await db.playthroughs.count()).toBe(0);
  });
});
