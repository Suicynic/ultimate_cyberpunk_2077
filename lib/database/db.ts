import Dexie, { type EntityTable } from "dexie";
import type {
  AchievementProgress,
  AppSettings,
  Build,
  CollectibleProgress,
  CustomMarker,
  DecisionEntry,
  EndingProgress,
  JobProgress,
  MarkerProgress,
  Note,
  PinnedObjective,
  Playthrough,
  RelationshipProgress,
} from "@/types/domain";

/**
 * Local-first persistence via IndexedDB.
 *
 * Only user-owned data lives here — canonical game data ships with the app
 * bundle and is never written to the database. The schema is versioned so
 * optional cloud sync can be layered on later (each row carries updatedAt
 * for last-write-wins merging).
 */
export class UC77Database extends Dexie {
  playthroughs!: EntityTable<Playthrough, "id">;
  jobProgress!: EntityTable<JobProgress, "id">;
  achievementProgress!: EntityTable<AchievementProgress, "id">;
  collectibleProgress!: EntityTable<CollectibleProgress, "id">;
  markerProgress!: EntityTable<MarkerProgress, "id">;
  customMarkers!: EntityTable<CustomMarker, "id">;
  decisions!: EntityTable<DecisionEntry, "id">;
  endingProgress!: EntityTable<EndingProgress, "id">;
  relationshipProgress!: EntityTable<RelationshipProgress, "id">;
  builds!: EntityTable<Build, "id">;
  notes!: EntityTable<Note, "id">;
  pins!: EntityTable<PinnedObjective, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("ultimate-cyberpunk-2077");
    this.version(1).stores({
      playthroughs: "id, status, updatedAt",
      jobProgress: "id, playthroughId, jobId, status, updatedAt",
      achievementProgress: "id, playthroughId, achievementId, state",
      collectibleProgress: "id, playthroughId, collectibleId, state",
      markerProgress: "id, playthroughId, markerId",
      customMarkers: "id, playthroughId",
      decisions: "id, playthroughId, jobId, createdAt",
      endingProgress: "id, playthroughId, endingId",
      relationshipProgress: "id, playthroughId, relationshipId",
      builds: "id, playthroughId, updatedAt",
      notes: "id, playthroughId, pinned, updatedAt",
      pins: "id, playthroughId, kind",
      settings: "id",
    });
  }
}

export const db = new UC77Database();

export const DEFAULT_SETTINGS: AppSettings = {
  id: "app",
  spoilerMode: "hide_major",
  revealedSpoilers: [],
  reducedEffects: false,
  conventionalLabels: false,
  updatedAt: new Date(0).toISOString(),
};
