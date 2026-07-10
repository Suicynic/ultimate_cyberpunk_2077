/**
 * Canonical-data validation gate (runs in CI).
 *
 * Checks every canonical record against its Zod schema, then verifies
 * referential integrity: prerequisites, related IDs, and marker links must
 * point at records that exist. Fails the build on any violation.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { achievements } from "../../data/achievements";
import { attributes, perks, relicPerks } from "../../data/build";
import { characters } from "../../data/characters";
import { collectibles } from "../../data/collections";
import { endings, relationships } from "../../data/endings";
import { factions } from "../../data/factions";
import { jobs } from "../../data/jobs";
import { mapMarkers } from "../../data/map";
import { resources } from "../../data/resources";
import {
  achievementDefSchema,
  attributeDefSchema,
  characterDefSchema,
  collectibleDefSchema,
  endingDefSchema,
  factionDefSchema,
  jobDefSchema,
  mapMarkerDefSchema,
  perkDefSchema,
  relationshipDefSchema,
  relicPerkDefSchema,
  resourceDefSchema,
} from "../../lib/validation/schemas";

let failures = 0;

function check(
  dataset: string,
  records: { id: string }[],
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      error?: { issues: { path: (string | number)[]; message: string }[] };
    };
  },
) {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      failures++;
      console.error(`✗ [${dataset}] duplicate ID: ${record.id}`);
    }
    seen.add(record.id);
    const result = schema.safeParse(record);
    if (!result.success) {
      failures++;
      const issue = result.error?.issues[0];
      console.error(
        `✗ [${dataset}] ${record.id}: ${issue ? `${issue.path.join(".")} — ${issue.message}` : "invalid"}`,
      );
    }
  }
  console.log(`  ${dataset}: ${records.length} records checked`);
}

console.log("Validating canonical datasets…");
check("jobs", jobs, jobDefSchema);
check("achievements", achievements, achievementDefSchema);
check("map-markers", mapMarkers, mapMarkerDefSchema);
check("attributes", attributes, attributeDefSchema);
check("perks", perks, perkDefSchema);
check("relic-perks", relicPerks, relicPerkDefSchema);
check("collectibles", collectibles, collectibleDefSchema);
check("endings", endings, endingDefSchema);
check("relationships", relationships, relationshipDefSchema);
check("resources", resources, resourceDefSchema);
check("factions", factions, factionDefSchema);
check("characters", characters, characterDefSchema);

// Referential integrity -----------------------------------------------------
console.log("Checking referential integrity…");
const jobIds = new Set(jobs.map((j) => j.id));
const markerIds = new Set(mapMarkers.map((m) => m.id));
const perkIds = new Set(perks.map((p) => p.id));

const refCheck = (
  dataset: string,
  id: string,
  field: string,
  target: string,
  pool: Set<string>,
) => {
  if (!pool.has(target)) {
    failures++;
    console.error(`✗ [${dataset}] ${id}: ${field} → "${target}" does not exist`);
  }
};

for (const job of jobs) {
  for (const p of job.prerequisites ?? []) refCheck("jobs", job.id, "prerequisites", p, jobIds);
  for (const r of job.relatedJobIds ?? []) refCheck("jobs", job.id, "relatedJobIds", r, jobIds);
}
for (const a of achievements) {
  for (const r of a.relatedJobIds ?? []) refCheck("achievements", a.id, "relatedJobIds", r, jobIds);
  for (const m of a.relatedMarkerIds ?? [])
    refCheck("achievements", a.id, "relatedMarkerIds", m, markerIds);
}
for (const m of mapMarkers) {
  if (m.relatedJobId) refCheck("map-markers", m.id, "relatedJobId", m.relatedJobId, jobIds);
}
for (const c of collectibles) {
  if (c.relatedJobId) refCheck("collectibles", c.id, "relatedJobId", c.relatedJobId, jobIds);
  if (c.relatedMarkerId)
    refCheck("collectibles", c.id, "relatedMarkerId", c.relatedMarkerId, markerIds);
}
for (const e of endings) {
  for (const r of e.relatedJobIds ?? []) refCheck("endings", e.id, "relatedJobIds", r, jobIds);
}
for (const r of relationships) {
  for (const j of r.relatedJobIds ?? [])
    refCheck("relationships", r.id, "relatedJobIds", j, jobIds);
}
for (const p of perks) {
  for (const req of p.requiresPerkIds ?? [])
    refCheck("perks", p.id, "requiresPerkIds", req, perkIds);
}

// Characters & factions ------------------------------------------------------
const characterIds = new Set(characters.map((c) => c.id));
const factionIds = new Set(factions.map((f) => f.id));

const uniqueField = (dataset: string, field: string, values: string[]) => {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) {
      failures++;
      console.error(`✗ [${dataset}] duplicate ${field}: ${v}`);
    }
    seen.add(v);
  }
};

uniqueField(
  "characters",
  "slug",
  characters.map((c) => c.slug),
);
uniqueField(
  "characters",
  "archiveId",
  characters.map((c) => c.archiveId),
);

for (const c of characters) {
  for (const r of c.relatedCharacterIds ?? [])
    refCheck("characters", c.id, "relatedCharacterIds", r, characterIds);
  for (const f of c.relatedFactionIds ?? [])
    refCheck("characters", c.id, "relatedFactionIds", f, factionIds);
  for (const j of c.firstRelevantJobIds ?? [])
    refCheck("characters", c.id, "firstRelevantJobIds", j, jobIds);

  // Spoiler classification must be internally consistent.
  const hasSpoiler = Boolean(c.spoilerBiography);
  if (hasSpoiler && c.spoilerLevel === "none") {
    failures++;
    console.error(`✗ [characters] ${c.id}: spoilerBiography requires a spoilerLevel above none`);
  }
  if (!hasSpoiler && c.spoilerLevel !== "none") {
    failures++;
    console.error(
      `✗ [characters] ${c.id}: spoilerLevel "${c.spoilerLevel}" requires a spoilerBiography`,
    );
  }

  // Portrait paths must resolve to a local asset under /public.
  if (c.portrait) {
    const abs = path.join(process.cwd(), "public", c.portrait.replace(/^\//, ""));
    if (!existsSync(abs)) {
      failures++;
      console.error(`✗ [characters] ${c.id}: portrait "${c.portrait}" does not exist locally`);
    }
  }
}

if (failures > 0) {
  console.error(`\nData validation FAILED with ${failures} error(s).`);
  process.exit(1);
}
console.log("\nAll canonical data valid ✓");
