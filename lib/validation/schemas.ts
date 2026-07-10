import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const spoilerLevelSchema = z.enum(["none", "minor", "major", "endgame"]);
export const expansionSchema = z.enum(["base", "phantom_liberty"]);
export const platformSchema = z.enum(["pc_steam", "pc_gog", "pc_epic", "playstation", "xbox"]);

export const verificationStatusSchema = z.enum([
  "unverified",
  "community_verified",
  "source_verified",
  "version_outdated",
  "disputed",
  "deprecated",
]);

export const sourceRefSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().optional(),
  accessedAt: z.string().optional(),
  gameVersion: z.string().optional(),
  notes: z.string().optional(),
});

export const canonicalMetaSchema = z.object({
  gameVersion: z.string().min(1),
  expansion: expansionSchema,
  lastVerified: z.string().optional(),
  verification: verificationStatusSchema,
  maybeOutdated: z.boolean().optional(),
  sources: z.array(sourceRefSchema).min(1, "Canonical records must cite at least one source"),
});

export const districtSchema = z.enum([
  "watson",
  "westbrook",
  "city_center",
  "heywood",
  "santo_domingo",
  "pacifica",
  "badlands",
  "dogtown",
]);

const canonicalId = (prefix: string) =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}:[a-z0-9-]+$`),
      `ID must look like "${prefix}:kebab-case-slug" and stay stable across versions`,
    );

// ---------------------------------------------------------------------------
// Canonical records
// ---------------------------------------------------------------------------

export const jobCategorySchema = z.enum([
  "main",
  "side",
  "gig",
  "ncpd",
  "cyberpsycho",
  "romance",
  "companion",
  "ending",
]);

export const jobDefSchema = z.object({
  id: canonicalId("job"),
  name: z.string().min(1),
  category: jobCategorySchema,
  district: districtSchema.optional(),
  questGiver: z.string().optional(),
  prerequisites: z.array(canonicalId("job")).optional(),
  unlockConditions: z.string().optional(),
  relatedJobIds: z.array(canonicalId("job")).optional(),
  questline: z.string().optional(),
  act: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  recommendedLevel: z.number().int().min(1).max(60).optional(),
  missable: z.boolean(),
  pointOfNoReturn: z.boolean().optional(),
  spoilerLevel: spoilerLevelSchema,
  summarySafe: z.string().min(1),
  summarySpoiler: z.string().optional(),
  meta: canonicalMetaSchema,
});

export const achievementProgressModelSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("boolean") }),
  z.object({
    type: z.literal("count"),
    target: z.number().int().positive(),
    unit: z.string().optional(),
  }),
  z.object({ type: z.literal("percent") }),
  z.object({
    type: z.literal("checklist"),
    steps: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
  }),
]);

export const achievementDefSchema = z.object({
  id: canonicalId("ach"),
  name: z.string().min(1),
  platforms: z.array(platformSchema).min(1),
  expansion: expansionSchema,
  descriptionPublic: z.string().min(1),
  descriptionHidden: z.string().optional(),
  isSecret: z.boolean(),
  progressModel: achievementProgressModelSchema,
  missable: z.boolean(),
  difficulty: z.number().int().min(1).max(5).optional(),
  relatedJobIds: z.array(canonicalId("job")).optional(),
  relatedMarkerIds: z.array(canonicalId("marker")).optional(),
  spoilerLevel: spoilerLevelSchema,
  meta: canonicalMetaSchema,
});

export const markerCategorySchema = z.enum([
  "fast_travel",
  "main_job",
  "side_job",
  "gig",
  "ncpd",
  "cyberpsycho",
  "tarot_card",
  "relic_terminal",
  "iconic_weapon",
  "vehicle",
  "apartment",
  "vendor",
  "ripperdoc",
  "hidden",
  "easter_egg",
  "custom",
]);

export const mapMarkerDefSchema = z.object({
  id: canonicalId("marker"),
  name: z.string().min(1),
  category: markerCategorySchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  district: districtSchema,
  description: z.string().min(1),
  spoilerLevel: spoilerLevelSchema,
  expansion: expansionSchema,
  relatedJobId: canonicalId("job").optional(),
  links: z.array(sourceRefSchema).optional(),
  meta: canonicalMetaSchema,
});

export const attributeIdSchema = z.enum([
  "body",
  "reflexes",
  "technical_ability",
  "intelligence",
  "cool",
]);

export const attributeDefSchema = z.object({
  id: attributeIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  meta: canonicalMetaSchema,
});

export const perkDefSchema = z.object({
  id: canonicalId("perk"),
  name: z.string().min(1),
  attribute: attributeIdSchema,
  requiredAttribute: z.number().int().min(3).max(20),
  maxRank: z.number().int().min(1).max(3),
  requiresPerkIds: z.array(canonicalId("perk")).optional(),
  effectSummary: z.string().min(1),
  expansion: expansionSchema,
  meta: canonicalMetaSchema,
});

export const relicPerkDefSchema = z.object({
  id: canonicalId("relic"),
  name: z.string().min(1),
  cost: z.number().int().positive(),
  requiresPerkIds: z.array(canonicalId("relic")).optional(),
  effectSummary: z.string().min(1),
  meta: canonicalMetaSchema,
});

export const collectibleTypeSchema = z.enum([
  "iconic_weapon",
  "cyberware",
  "quickhack",
  "vehicle",
  "apartment",
  "tarot_card",
  "relic_terminal",
  "quest_reward",
]);

export const collectibleDefSchema = z.object({
  id: canonicalId("col"),
  name: z.string().min(1),
  type: collectibleTypeSchema,
  acquisition: z.string().min(1),
  district: districtSchema.optional(),
  relatedJobId: canonicalId("job").optional(),
  relatedMarkerId: canonicalId("marker").optional(),
  missable: z.boolean(),
  spoilerLevel: spoilerLevelSchema,
  expansion: expansionSchema,
  meta: canonicalMetaSchema,
});

export const endingRequirementSchema = z.object({
  text: z.string().min(1),
  confidence: z.enum(["confirmed", "probable", "disputed"]),
});

export const endingDefSchema = z.object({
  id: canonicalId("ending"),
  codename: z.string().min(1),
  name: z.string().min(1),
  expansion: expansionSchema,
  summarySpoiler: z.string().min(1),
  requirements: z.array(endingRequirementSchema),
  relatedJobIds: z.array(canonicalId("job")).optional(),
  meta: canonicalMetaSchema,
});

export const relationshipDefSchema = z.object({
  id: canonicalId("rel"),
  characterName: z.string().min(1),
  kind: z.enum(["romance", "companion"]),
  availability: z.string().min(1),
  relatedJobIds: z.array(canonicalId("job")).optional(),
  spoilerLevel: spoilerLevelSchema,
  meta: canonicalMetaSchema,
});

export const resourceCategorySchema = z.enum([
  "official",
  "wiki",
  "build_guide",
  "map",
  "achievement_guide",
  "modding",
  "accessibility",
  "performance",
  "lore",
  "community_tool",
  "video",
  "save_management",
]);

export const resourceDefSchema = z.object({
  id: canonicalId("res"),
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  category: resourceCategorySchema,
  summary: z.string().min(1),
  gameVersion: z.string().optional(),
  platforms: z.array(platformSchema).optional(),
  expansion: expansionSchema.optional(),
  lastChecked: z.string().optional(),
  trust: z.enum(["official", "community", "speculative"]),
});

// ---------------------------------------------------------------------------
// User-owned records
// ---------------------------------------------------------------------------

export const spoilerModeSchema = z.enum(["hide_all", "hide_major", "show_all"]);

export const playthroughSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  lifepath: z.enum(["nomad", "streetkid", "corpo"]),
  label: z.string().max(80).optional(),
  difficulty: z.enum(["easy", "normal", "hard", "very_hard"]),
  platform: platformSchema,
  gameVersion: z.string().min(1),
  hasPhantomLiberty: z.boolean(),
  level: z.number().int().min(1).max(60),
  streetCred: z.number().int().min(1).max(50),
  act: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["planned", "active", "paused", "completed", "abandoned", "new_game_plus"]),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  concept: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  spoilerMode: spoilerModeSchema.optional(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const jobStatusSchema = z.enum([
  "locked",
  "available",
  "active",
  "completed",
  "failed",
  "missed",
  "skipped",
]);

export const jobProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  jobId: z.string().min(1),
  status: jobStatusSchema,
  completedAt: z.string().optional(),
  pinned: z.boolean(),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const achievementProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  achievementId: z.string().min(1),
  state: z.enum(["locked", "in_progress", "unlocked"]),
  count: z.number().int().min(0).optional(),
  steps: z.array(z.string()).optional(),
  unlockedAt: z.string().optional(),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const collectibleProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  collectibleId: z.string().min(1),
  state: z.enum(["not_obtained", "obtained", "missed", "upgraded", "stored", "equipped", "sold"]),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const markerProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  markerId: z.string().min(1),
  discovered: z.boolean(),
  completed: z.boolean(),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const customMarkerSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  name: z.string().min(1).max(80),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  district: districtSchema.optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const decisionEntrySchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  jobId: z.string().optional(),
  title: z.string().min(1).max(160),
  choice: z.string().min(1),
  session: z.string().optional(),
  immediateResult: z.string().optional(),
  laterConsequence: z.string().optional(),
  charactersAffected: z.string().optional(),
  factionImpact: z.string().optional(),
  romanceImpact: z.string().optional(),
  endingImpact: z.string().optional(),
  reasoning: z.string().optional(),
  spoilerLevel: spoilerLevelSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const endingProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  endingId: z.string().min(1),
  state: z.enum(["hidden", "revealed", "unlocked", "completed"]),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const relationshipProgressSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  relationshipId: z.string().min(1),
  state: z.enum(["not_met", "met", "in_progress", "committed", "declined", "ended"]),
  notes: z.string().optional(),
  updatedAt: z.string(),
});

export const buildSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().optional(),
  name: z.string().min(1).max(80),
  gameVersion: z.string().min(1),
  targetLevel: z.number().int().min(1).max(60),
  attributes: z.object({
    body: z.number().int().min(3).max(20),
    reflexes: z.number().int().min(3).max(20),
    technical_ability: z.number().int().min(3).max(20),
    intelligence: z.number().int().min(3).max(20),
    cool: z.number().int().min(3).max(20),
  }),
  perks: z.record(z.string(), z.number().int().min(1).max(3)),
  relicPerks: z.array(z.string()),
  equipment: z.object({
    weapons: z.array(z.string()),
    cyberware: z.array(z.string()),
    operatingSystem: z.string().optional(),
    quickhacks: z.array(z.string()),
    clothing: z.array(z.string()),
    vehicles: z.array(z.string()),
  }),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().optional(),
  title: z.string().min(1).max(160),
  body: z.string(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const pinnedObjectiveSchema = z.object({
  id: z.string().min(1),
  playthroughId: z.string().min(1),
  kind: z.enum(["job", "achievement", "marker", "collectible", "note", "custom"]),
  refId: z.string().optional(),
  label: z.string().min(1).max(160),
  done: z.boolean(),
  createdAt: z.string(),
});

export const appSettingsSchema = z.object({
  id: z.literal("app"),
  activePlaythroughId: z.string().optional(),
  spoilerMode: spoilerModeSchema,
  revealedSpoilers: z.array(z.string()),
  reducedEffects: z.boolean(),
  conventionalLabels: z.boolean(),
  updatedAt: z.string(),
});

// ---------------------------------------------------------------------------
// Import / export envelope
// ---------------------------------------------------------------------------

export const exportEnvelopeSchema = z.object({
  app: z.literal("ultimate-cyberpunk-2077"),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  data: z.object({
    playthroughs: z.array(playthroughSchema),
    jobProgress: z.array(jobProgressSchema),
    achievementProgress: z.array(achievementProgressSchema),
    collectibleProgress: z.array(collectibleProgressSchema),
    markerProgress: z.array(markerProgressSchema),
    customMarkers: z.array(customMarkerSchema),
    decisions: z.array(decisionEntrySchema),
    endingProgress: z.array(endingProgressSchema),
    relationshipProgress: z.array(relationshipProgressSchema),
    builds: z.array(buildSchema),
    notes: z.array(noteSchema),
    pins: z.array(pinnedObjectiveSchema),
    settings: appSettingsSchema.optional(),
  }),
});

export type ExportEnvelopeInput = z.input<typeof exportEnvelopeSchema>;
