/**
 * Domain model for Ultimate Cyberpunk 2077.
 *
 * Two strictly separated data families:
 *  - Canonical game data (read-only reference records shipped with the app,
 *    schema-validated in CI, always carrying source attribution).
 *  - User-owned data (progress, notes, builds, settings) persisted locally
 *    in IndexedDB and exportable as JSON.
 *
 * Canonical records are never mutated to store personal progress.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Stable identifier. Canonical IDs are namespaced, e.g. "job:the-rescue". */
export type EntityId = string;

export type SpoilerLevel = "none" | "minor" | "major" | "endgame";

export type Expansion = "base" | "phantom_liberty";

export type Platform = "pc_steam" | "pc_gog" | "pc_epic" | "playstation" | "xbox";

export type VerificationStatus =
  | "unverified"
  | "community_verified"
  | "source_verified"
  | "version_outdated"
  | "disputed"
  | "deprecated";

/** Provenance for every externally sourced fact. */
export interface SourceRef {
  title: string;
  url: string;
  publisher?: string;
  accessedAt?: string; // ISO date
  gameVersion?: string;
  notes?: string;
}

/** Version-awareness + provenance metadata attached to canonical records. */
export interface CanonicalMeta {
  /** Game version the record was last verified against, e.g. "2.3". */
  gameVersion: string;
  expansion: Expansion;
  lastVerified?: string; // ISO date
  verification: VerificationStatus;
  maybeOutdated?: boolean;
  sources: SourceRef[];
}

export type District =
  | "watson"
  | "westbrook"
  | "city_center"
  | "heywood"
  | "santo_domingo"
  | "pacifica"
  | "badlands"
  | "dogtown";

// ---------------------------------------------------------------------------
// Canonical: Jobs
// ---------------------------------------------------------------------------

export type JobCategory =
  "main" | "side" | "gig" | "ncpd" | "cyberpsycho" | "romance" | "companion" | "ending";

export interface JobDef {
  id: EntityId;
  name: string;
  category: JobCategory;
  district?: District;
  questGiver?: string;
  /** IDs of jobs that must be completed (or started) before this one. */
  prerequisites?: EntityId[];
  unlockConditions?: string;
  relatedJobIds?: EntityId[];
  questline?: string;
  act?: 1 | 2 | 3;
  recommendedLevel?: number;
  missable: boolean;
  pointOfNoReturn?: boolean;
  spoilerLevel: SpoilerLevel;
  /** Spoiler-free one-line summary. Original wording, never copied text. */
  summarySafe: string;
  /** Outcome/decision notes shown only behind the spoiler shield. */
  summarySpoiler?: string;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Achievements
// ---------------------------------------------------------------------------

export type AchievementProgressModel =
  | { type: "boolean" }
  | { type: "count"; target: number; unit?: string }
  | { type: "percent" }
  | { type: "checklist"; steps: { id: string; label: string }[] };

export interface AchievementDef {
  id: EntityId;
  name: string;
  platforms: Platform[];
  expansion: Expansion;
  descriptionPublic: string;
  /** Real requirement for hidden/secret achievements — spoiler shielded. */
  descriptionHidden?: string;
  isSecret: boolean;
  progressModel: AchievementProgressModel;
  missable: boolean;
  /** 1 (trivial) – 5 (very hard). Editorial estimate, not an official stat. */
  difficulty?: 1 | 2 | 3 | 4 | 5;
  relatedJobIds?: EntityId[];
  relatedMarkerIds?: EntityId[];
  spoilerLevel: SpoilerLevel;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Map markers
// ---------------------------------------------------------------------------

export type MarkerCategory =
  | "fast_travel"
  | "main_job"
  | "side_job"
  | "gig"
  | "ncpd"
  | "cyberpsycho"
  | "tarot_card"
  | "relic_terminal"
  | "iconic_weapon"
  | "vehicle"
  | "apartment"
  | "vendor"
  | "ripperdoc"
  | "hidden"
  | "easter_egg"
  | "custom";

export interface MapMarkerDef {
  id: EntityId;
  name: string;
  category: MarkerCategory;
  /**
   * Normalized coordinates (0–100 on both axes) on the original schematic
   * map that ships with the app. Positions are approximate by design; the
   * map layer is architected so licensed/community tile sets with real
   * coordinate systems can be added later.
   */
  x: number;
  y: number;
  district: District;
  description: string;
  spoilerLevel: SpoilerLevel;
  expansion: Expansion;
  relatedJobId?: EntityId;
  links?: SourceRef[];
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Build planner reference data (2.x systems)
// ---------------------------------------------------------------------------

export type AttributeId = "body" | "reflexes" | "technical_ability" | "intelligence" | "cool";

export interface AttributeDef {
  id: AttributeId;
  name: string;
  description: string;
  meta: CanonicalMeta;
}

export interface PerkDef {
  id: EntityId;
  name: string;
  attribute: AttributeId;
  /** Attribute score required to unlock the perk's tier. */
  requiredAttribute: number;
  maxRank: number;
  /** Other perks that must be taken first. */
  requiresPerkIds?: EntityId[];
  /** Qualitative effect summary in original wording — no copied text. */
  effectSummary: string;
  expansion: Expansion;
  meta: CanonicalMeta;
}

export interface RelicPerkDef {
  id: EntityId;
  name: string;
  cost: number;
  requiresPerkIds?: EntityId[];
  effectSummary: string;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Collectibles (iconics, vehicles, apartments, tarot, cyberware…)
// ---------------------------------------------------------------------------

export type CollectibleType =
  | "iconic_weapon"
  | "cyberware"
  | "quickhack"
  | "vehicle"
  | "apartment"
  | "tarot_card"
  | "relic_terminal"
  | "quest_reward";

export interface CollectibleDef {
  id: EntityId;
  name: string;
  type: CollectibleType;
  /** How the item is obtained, in original spoiler-conscious wording. */
  acquisition: string;
  district?: District;
  relatedJobId?: EntityId;
  relatedMarkerId?: EntityId;
  missable: boolean;
  spoilerLevel: SpoilerLevel;
  expansion: Expansion;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Endings & relationships
// ---------------------------------------------------------------------------

export type RequirementConfidence = "confirmed" | "probable" | "disputed";

export interface EndingRequirement {
  text: string;
  confidence: RequirementConfidence;
}

export interface EndingDef {
  id: EntityId;
  /** Spoiler-safe codename shown before reveal, e.g. "EPILOGUE //03". */
  codename: string;
  /** Real (spoiler) name, shown only after reveal. */
  name: string;
  expansion: Expansion;
  summarySpoiler: string;
  requirements: EndingRequirement[];
  relatedJobIds?: EntityId[];
  meta: CanonicalMeta;
}

export interface RelationshipDef {
  id: EntityId;
  /** Spoiler-safe display name (character names are not spoilers). */
  characterName: string;
  kind: "romance" | "companion";
  /** Lifepath/gender/body-type availability notes, original wording. */
  availability: string;
  relatedJobIds?: EntityId[];
  spoilerLevel: SpoilerLevel;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Factions
// ---------------------------------------------------------------------------

export type FactionCategory = "corporation" | "gang" | "nomad" | "government" | "organization";

export interface FactionDef {
  id: EntityId;
  name: string;
  shortName?: string;
  category: FactionCategory;
  /** Spoiler-safe paraphrase — original wording, never copied. */
  description: string;
  /** Home district or region, when the game establishes one. */
  location?: string;
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Character archive (NC Personnel Archive)
// ---------------------------------------------------------------------------

/**
 * Which release(s) a character is relevant to. Distinct from
 * `CanonicalMeta.expansion` (which records where a fact was verified) because a
 * character can span both the base game and Phantom Liberty.
 */
export type GameScope = "base_game" | "phantom_liberty" | "both";

export type CharacterImportance = "primary" | "major" | "supporting";

/**
 * Loose character grouping used only for the archive's category filter. It is
 * deliberately coarse and always spoiler-safe.
 */
export type CharacterCategory =
  | "core"
  | "fixer"
  | "netrunner"
  | "corporate"
  | "nomad"
  | "gang"
  | "night_city"
  | "phantom_liberty";

/**
 * Spoiler-safe operational status shown by default. This describes a
 * character's general standing as the player first encounters them — never a
 * fate, death, or twist. Anything spoiler-sensitive lives in
 * `spoilerBiography` behind the shield.
 */
export type CharacterStatus = "active" | "unknown" | "legend";

/** Spoiler-safe relationship relevance tags (mirrors the endings dataset). */
export type CharacterRelationshipType = "romance" | "companion" | "quest" | "fixer";

export interface CharacterDef {
  /** Namespaced canonical ID, e.g. "character:panam-palmer". */
  id: EntityId;
  /** URL slug — must equal the ID suffix and stay spoiler-safe. */
  slug: string;
  /** Publicly-known name (names are not treated as spoilers). */
  name: string;
  /** Spoiler-safe aliases / handles only. */
  aliases?: string[];
  /**
   * Original in-app catalog code assigned by this project (e.g. "NCPA-0001").
   * Not a game statistic — it is a record locator for the archive UI only.
   */
  archiveId: string;
  /** Optional local portrait path under /public. Fallback used when absent. */
  portrait?: string;
  /** Fallback identity mark, e.g. "V", "JS". */
  initials: string;
  /** Spoiler-safe role / occupation summary. */
  role: string;
  occupations?: string[];
  /** Spoiler-safe affiliation display strings; the first is treated as primary. */
  affiliations: string[];
  /** Optional district / region. */
  location?: string;
  /** Only when the game establishes it. */
  gender?: string;
  /** Only when the game establishes it. */
  pronouns?: string;
  status: CharacterStatus;
  gameScope: GameScope;
  importance: CharacterImportance;
  category: CharacterCategory;
  relationshipTypes?: CharacterRelationshipType[];
  /** Canonical references to other characters in this dataset. */
  relatedCharacterIds?: EntityId[];
  /** Canonical references into the factions dataset. */
  relatedFactionIds?: EntityId[];
  /** Canonical references into the jobs dataset. */
  firstRelevantJobIds?: EntityId[];
  /** Spoiler-safe one-line excerpt for cards. */
  shortDescription: string;
  /** Spoiler-safe biography shown by default. */
  biography: string;
  /** Spoiler-sensitive material shown only behind the spoiler shield. */
  spoilerBiography?: string;
  /** Gating level for `spoilerBiography`; "none" when there is none. */
  spoilerLevel: SpoilerLevel;
  tags: string[];
  meta: CanonicalMeta;
}

// ---------------------------------------------------------------------------
// Canonical: Resource library
// ---------------------------------------------------------------------------

export type ResourceCategory =
  | "official"
  | "wiki"
  | "build_guide"
  | "map"
  | "achievement_guide"
  | "modding"
  | "accessibility"
  | "performance"
  | "lore"
  | "community_tool"
  | "video"
  | "save_management";

export type ResourceTrust = "official" | "community" | "speculative";

export interface ResourceDef {
  id: EntityId;
  title: string;
  url: string;
  publisher: string;
  category: ResourceCategory;
  summary: string;
  gameVersion?: string;
  platforms?: Platform[];
  expansion?: Expansion;
  lastChecked?: string; // ISO date
  trust: ResourceTrust;
}

// ---------------------------------------------------------------------------
// User-owned data
// ---------------------------------------------------------------------------

export type Lifepath = "nomad" | "streetkid" | "corpo";

export type PlaythroughStatus =
  "planned" | "active" | "paused" | "completed" | "abandoned" | "new_game_plus";

export type Difficulty = "easy" | "normal" | "hard" | "very_hard";

/** Global spoiler visibility mode. */
export type SpoilerMode = "hide_all" | "hide_major" | "show_all";

export interface Playthrough {
  id: EntityId;
  name: string;
  lifepath: Lifepath;
  /** Optional pronouns / personal label. */
  label?: string;
  difficulty: Difficulty;
  platform: Platform;
  gameVersion: string;
  hasPhantomLiberty: boolean;
  level: number;
  streetCred: number;
  act: 1 | 2 | 3;
  status: PlaythroughStatus;
  startedAt?: string;
  completedAt?: string;
  concept?: string;
  notes?: string;
  tags: string[];
  /** Per-playthrough spoiler override; falls back to the global setting. */
  spoilerMode?: SpoilerMode;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus =
  "locked" | "available" | "active" | "completed" | "failed" | "missed" | "skipped";

export interface JobProgress {
  /** `${playthroughId}:${jobId}` — stable composite key. */
  id: string;
  playthroughId: EntityId;
  jobId: EntityId;
  status: JobStatus;
  completedAt?: string;
  pinned: boolean;
  notes?: string;
  updatedAt: string;
}

export type AchievementState = "locked" | "in_progress" | "unlocked";

export interface AchievementProgress {
  id: string; // `${playthroughId}:${achievementId}`
  playthroughId: EntityId;
  achievementId: EntityId;
  state: AchievementState;
  /** Current count for count-model achievements. */
  count?: number;
  /** Completed step IDs for checklist-model achievements. */
  steps?: string[];
  unlockedAt?: string;
  notes?: string;
  updatedAt: string;
}

export type CollectibleState =
  "not_obtained" | "obtained" | "missed" | "upgraded" | "stored" | "equipped" | "sold";

export interface CollectibleProgress {
  id: string; // `${playthroughId}:${collectibleId}`
  playthroughId: EntityId;
  collectibleId: EntityId;
  state: CollectibleState;
  notes?: string;
  updatedAt: string;
}

export interface MarkerProgress {
  id: string; // `${playthroughId}:${markerId}`
  playthroughId: EntityId;
  markerId: EntityId;
  discovered: boolean;
  completed: boolean;
  notes?: string;
  updatedAt: string;
}

export interface CustomMarker {
  id: EntityId;
  playthroughId: EntityId;
  name: string;
  x: number;
  y: number;
  district?: District;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionEntry {
  id: EntityId;
  playthroughId: EntityId;
  jobId?: EntityId;
  title: string;
  choice: string;
  session?: string;
  immediateResult?: string;
  laterConsequence?: string;
  charactersAffected?: string;
  factionImpact?: string;
  romanceImpact?: string;
  endingImpact?: string;
  reasoning?: string;
  spoilerLevel: SpoilerLevel;
  createdAt: string;
  updatedAt: string;
}

export type EndingProgressState = "hidden" | "revealed" | "unlocked" | "completed";

export interface EndingProgress {
  id: string; // `${playthroughId}:${endingId}`
  playthroughId: EntityId;
  endingId: EntityId;
  state: EndingProgressState;
  notes?: string;
  updatedAt: string;
}

export type RelationshipProgressState =
  "not_met" | "met" | "in_progress" | "committed" | "declined" | "ended";

export interface RelationshipProgress {
  id: string; // `${playthroughId}:${relationshipId}`
  playthroughId: EntityId;
  relationshipId: EntityId;
  state: RelationshipProgressState;
  notes?: string;
  updatedAt: string;
}

export interface CharacterProgress {
  id: string; // `${playthroughId}:${characterId}`
  playthroughId: EntityId;
  characterId: EntityId;
  encountered: boolean;
  notes?: string;
  updatedAt: string;
}

export interface BuildEquipment {
  weapons: string[];
  cyberware: string[];
  operatingSystem?: string;
  quickhacks: string[];
  clothing: string[];
  vehicles: string[];
}

export interface Build {
  id: EntityId;
  playthroughId?: EntityId;
  name: string;
  gameVersion: string;
  targetLevel: number;
  attributes: Record<AttributeId, number>;
  /** perkId -> rank taken. */
  perks: Record<string, number>;
  relicPerks: EntityId[];
  equipment: BuildEquipment;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: EntityId;
  playthroughId?: EntityId;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PinKind = "job" | "achievement" | "marker" | "collectible" | "note" | "custom";

export interface PinnedObjective {
  id: EntityId;
  playthroughId: EntityId;
  kind: PinKind;
  refId?: EntityId;
  label: string;
  done: boolean;
  createdAt: string;
}

export interface AppSettings {
  id: "app";
  activePlaythroughId?: EntityId;
  spoilerMode: SpoilerMode;
  /** IDs of individually revealed spoiler items (reveal-on-demand). */
  revealedSpoilers: string[];
  /** Reduce glitch/scanline/flicker/animation effects. */
  reducedEffects: boolean;
  /** Use conventional labels instead of thematic interface language. */
  conventionalLabels: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Import / export envelope
// ---------------------------------------------------------------------------

export interface ExportEnvelope {
  app: "ultimate-cyberpunk-2077";
  schemaVersion: number;
  exportedAt: string;
  data: {
    playthroughs: Playthrough[];
    jobProgress: JobProgress[];
    achievementProgress: AchievementProgress[];
    collectibleProgress: CollectibleProgress[];
    markerProgress: MarkerProgress[];
    customMarkers: CustomMarker[];
    decisions: DecisionEntry[];
    endingProgress: EndingProgress[];
    relationshipProgress: RelationshipProgress[];
    builds: Build[];
    notes: Note[];
    pins: PinnedObjective[];
    /** Optional for backward compatibility with v1 exports. */
    characterProgress?: CharacterProgress[];
    settings?: AppSettings;
  };
}

export const EXPORT_SCHEMA_VERSION = 2;
