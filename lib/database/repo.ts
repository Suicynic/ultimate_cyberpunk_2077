import { db, DEFAULT_SETTINGS } from "@/lib/database/db";
import { newId, nowIso, progressId } from "@/lib/ids";
import type {
  AchievementProgress,
  AchievementState,
  AppSettings,
  Build,
  CollectibleProgress,
  CollectibleState,
  JobProgress,
  JobStatus,
  MarkerProgress,
  Playthrough,
  SpoilerMode,
} from "@/types/domain";

/**
 * Repository layer: all mutations to user-owned data go through here so the
 * persistence backend can later be swapped or synced without touching UI code.
 */

// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------

export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get("app")) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id">>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "app", updatedAt: nowIso() });
}

export async function setSpoilerMode(mode: SpoilerMode): Promise<void> {
  await updateSettings({ spoilerMode: mode });
}

export async function revealSpoiler(key: string): Promise<void> {
  const current = await getSettings();
  if (!current.revealedSpoilers.includes(key)) {
    await updateSettings({ revealedSpoilers: [...current.revealedSpoilers, key] });
  }
}

export async function resetRevealedSpoilers(): Promise<void> {
  await updateSettings({ revealedSpoilers: [] });
}

// --------------------------------------------------------------------------
// Playthroughs
// --------------------------------------------------------------------------

export type NewPlaythrough = Pick<
  Playthrough,
  "name" | "lifepath" | "difficulty" | "platform" | "hasPhantomLiberty"
> &
  Partial<
    Pick<
      Playthrough,
      | "label"
      | "gameVersion"
      | "level"
      | "streetCred"
      | "act"
      | "status"
      | "concept"
      | "notes"
      | "tags"
      | "startedAt"
    >
  >;

export async function createPlaythrough(input: NewPlaythrough): Promise<Playthrough> {
  const now = nowIso();
  const playthrough: Playthrough = {
    id: newId("run"),
    name: input.name,
    lifepath: input.lifepath,
    label: input.label,
    difficulty: input.difficulty,
    platform: input.platform,
    gameVersion: input.gameVersion ?? "2.3",
    hasPhantomLiberty: input.hasPhantomLiberty,
    level: input.level ?? 1,
    streetCred: input.streetCred ?? 1,
    act: input.act ?? 1,
    status: input.status ?? "active",
    startedAt: input.startedAt,
    concept: input.concept,
    notes: input.notes,
    tags: input.tags ?? [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.playthroughs.add(playthrough);
  const settings = await getSettings();
  if (!settings.activePlaythroughId) {
    await updateSettings({ activePlaythroughId: playthrough.id });
  }
  return playthrough;
}

export async function updatePlaythrough(
  id: string,
  patch: Partial<Omit<Playthrough, "id" | "createdAt">>,
): Promise<void> {
  await db.playthroughs.update(id, { ...patch, updatedAt: nowIso() });
}

export async function setActivePlaythrough(id: string | undefined): Promise<void> {
  await updateSettings({ activePlaythroughId: id });
}

export async function duplicatePlaythrough(id: string): Promise<Playthrough | undefined> {
  const source = await db.playthroughs.get(id);
  if (!source) return undefined;
  const now = nowIso();
  const copy: Playthrough = {
    ...source,
    id: newId("run"),
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.playthroughs.add(copy);

  // Copy per-playthrough progress so a duplicate is a true fork of the run.
  const [jobs, achievements, collectibles, markers, custom, endings, rels, pins] =
    await Promise.all([
      db.jobProgress.where("playthroughId").equals(id).toArray(),
      db.achievementProgress.where("playthroughId").equals(id).toArray(),
      db.collectibleProgress.where("playthroughId").equals(id).toArray(),
      db.markerProgress.where("playthroughId").equals(id).toArray(),
      db.customMarkers.where("playthroughId").equals(id).toArray(),
      db.endingProgress.where("playthroughId").equals(id).toArray(),
      db.relationshipProgress.where("playthroughId").equals(id).toArray(),
      db.pins.where("playthroughId").equals(id).toArray(),
    ]);
  await Promise.all([
    db.jobProgress.bulkAdd(
      jobs.map((r) => ({ ...r, id: progressId(copy.id, r.jobId), playthroughId: copy.id })),
    ),
    db.achievementProgress.bulkAdd(
      achievements.map((r) => ({
        ...r,
        id: progressId(copy.id, r.achievementId),
        playthroughId: copy.id,
      })),
    ),
    db.collectibleProgress.bulkAdd(
      collectibles.map((r) => ({
        ...r,
        id: progressId(copy.id, r.collectibleId),
        playthroughId: copy.id,
      })),
    ),
    db.markerProgress.bulkAdd(
      markers.map((r) => ({ ...r, id: progressId(copy.id, r.markerId), playthroughId: copy.id })),
    ),
    db.customMarkers.bulkAdd(
      custom.map((r) => ({ ...r, id: newId("cmk"), playthroughId: copy.id })),
    ),
    db.endingProgress.bulkAdd(
      endings.map((r) => ({ ...r, id: progressId(copy.id, r.endingId), playthroughId: copy.id })),
    ),
    db.relationshipProgress.bulkAdd(
      rels.map((r) => ({
        ...r,
        id: progressId(copy.id, r.relationshipId),
        playthroughId: copy.id,
      })),
    ),
    db.pins.bulkAdd(pins.map((r) => ({ ...r, id: newId("pin"), playthroughId: copy.id }))),
  ]);
  return copy;
}

/** Permanently delete a playthrough and every record that belongs to it. */
export async function deletePlaythrough(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.playthroughs,
      db.jobProgress,
      db.achievementProgress,
      db.collectibleProgress,
      db.markerProgress,
      db.customMarkers,
      db.decisions,
      db.endingProgress,
      db.relationshipProgress,
      db.pins,
      db.notes,
      db.builds,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.playthroughs.delete(id),
        db.jobProgress.where("playthroughId").equals(id).delete(),
        db.achievementProgress.where("playthroughId").equals(id).delete(),
        db.collectibleProgress.where("playthroughId").equals(id).delete(),
        db.markerProgress.where("playthroughId").equals(id).delete(),
        db.customMarkers.where("playthroughId").equals(id).delete(),
        db.decisions.where("playthroughId").equals(id).delete(),
        db.endingProgress.where("playthroughId").equals(id).delete(),
        db.relationshipProgress.where("playthroughId").equals(id).delete(),
        db.pins.where("playthroughId").equals(id).delete(),
        db.notes.where("playthroughId").equals(id).delete(),
        db.builds.where("playthroughId").equals(id).modify({ playthroughId: undefined }),
      ]);
      const settings = await getSettings();
      if (settings.activePlaythroughId === id) {
        const remaining = await db.playthroughs.toCollection().first();
        await updateSettings({ activePlaythroughId: remaining?.id });
      }
    },
  );
}

// --------------------------------------------------------------------------
// Job progress
// --------------------------------------------------------------------------

export async function setJobStatus(
  playthroughId: string,
  jobId: string,
  status: JobStatus,
): Promise<void> {
  const id = progressId(playthroughId, jobId);
  const existing = await db.jobProgress.get(id);
  const row: JobProgress = {
    id,
    playthroughId,
    jobId,
    status,
    pinned: existing?.pinned ?? false,
    notes: existing?.notes,
    completedAt: status === "completed" ? (existing?.completedAt ?? nowIso()) : undefined,
    updatedAt: nowIso(),
  };
  await db.jobProgress.put(row);
}

export async function setJobNotes(
  playthroughId: string,
  jobId: string,
  notes: string,
): Promise<void> {
  const id = progressId(playthroughId, jobId);
  const existing = await db.jobProgress.get(id);
  await db.jobProgress.put({
    id,
    playthroughId,
    jobId,
    status: existing?.status ?? "available",
    pinned: existing?.pinned ?? false,
    completedAt: existing?.completedAt,
    notes,
    updatedAt: nowIso(),
  });
}

export async function toggleJobPinned(playthroughId: string, jobId: string): Promise<void> {
  const id = progressId(playthroughId, jobId);
  const existing = await db.jobProgress.get(id);
  await db.jobProgress.put({
    id,
    playthroughId,
    jobId,
    status: existing?.status ?? "available",
    pinned: !(existing?.pinned ?? false),
    completedAt: existing?.completedAt,
    notes: existing?.notes,
    updatedAt: nowIso(),
  });
}

export async function bulkSetJobStatus(
  playthroughId: string,
  jobIds: string[],
  status: JobStatus,
): Promise<void> {
  await Promise.all(jobIds.map((jobId) => setJobStatus(playthroughId, jobId, status)));
}

// --------------------------------------------------------------------------
// Achievement progress
// --------------------------------------------------------------------------

export async function upsertAchievementProgress(
  playthroughId: string,
  achievementId: string,
  patch: Partial<Pick<AchievementProgress, "state" | "count" | "steps" | "notes">>,
): Promise<void> {
  const id = progressId(playthroughId, achievementId);
  const existing = await db.achievementProgress.get(id);
  const state: AchievementState = patch.state ?? existing?.state ?? "locked";
  await db.achievementProgress.put({
    id,
    playthroughId,
    achievementId,
    state,
    count: patch.count ?? existing?.count,
    steps: patch.steps ?? existing?.steps,
    notes: patch.notes ?? existing?.notes,
    unlockedAt: state === "unlocked" ? (existing?.unlockedAt ?? nowIso()) : existing?.unlockedAt,
    updatedAt: nowIso(),
  });
}

// --------------------------------------------------------------------------
// Collectibles & markers
// --------------------------------------------------------------------------

export async function setCollectibleState(
  playthroughId: string,
  collectibleId: string,
  state: CollectibleState,
): Promise<void> {
  const id = progressId(playthroughId, collectibleId);
  const existing = await db.collectibleProgress.get(id);
  const row: CollectibleProgress = {
    id,
    playthroughId,
    collectibleId,
    state,
    notes: existing?.notes,
    updatedAt: nowIso(),
  };
  await db.collectibleProgress.put(row);
}

export async function setMarkerProgress(
  playthroughId: string,
  markerId: string,
  patch: Partial<Pick<MarkerProgress, "discovered" | "completed" | "notes">>,
): Promise<void> {
  const id = progressId(playthroughId, markerId);
  const existing = await db.markerProgress.get(id);
  await db.markerProgress.put({
    id,
    playthroughId,
    markerId,
    discovered: patch.discovered ?? existing?.discovered ?? false,
    completed: patch.completed ?? existing?.completed ?? false,
    notes: patch.notes ?? existing?.notes,
    updatedAt: nowIso(),
  });
}

// --------------------------------------------------------------------------
// Builds
// --------------------------------------------------------------------------

export function emptyBuild(name: string, playthroughId?: string): Build {
  const now = nowIso();
  return {
    id: newId("build"),
    playthroughId,
    name,
    gameVersion: "2.3",
    targetLevel: 50,
    attributes: { body: 3, reflexes: 3, technical_ability: 3, intelligence: 3, cool: 3 },
    perks: {},
    relicPerks: [],
    equipment: {
      weapons: [],
      cyberware: [],
      quickhacks: [],
      clothing: [],
      vehicles: [],
    },
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveBuild(build: Build): Promise<void> {
  await db.builds.put({ ...build, updatedAt: nowIso() });
}

export async function duplicateBuild(id: string): Promise<Build | undefined> {
  const source = await db.builds.get(id);
  if (!source) return undefined;
  const now = nowIso();
  const copy: Build = {
    ...source,
    id: newId("build"),
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.builds.add(copy);
  return copy;
}
