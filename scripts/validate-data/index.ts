/**
 * Canonical-data validation gate (runs in CI).
 *
 * Checks every canonical record against its Zod schema, then verifies
 * referential integrity: prerequisites, related IDs, and marker links must
 * point at records that exist. Fails the build on any violation.
 */
import { achievements } from "../../data/achievements";
import { attributes, perks, relicPerks } from "../../data/build";
import { collectibles } from "../../data/collections";
import { endings, relationships } from "../../data/endings";
import { jobs } from "../../data/jobs";
import { mapMarkers } from "../../data/map";
import { resources } from "../../data/resources";
import {
  achievementDefSchema,
  attributeDefSchema,
  collectibleDefSchema,
  endingDefSchema,
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

if (failures > 0) {
  console.error(`\nData validation FAILED with ${failures} error(s).`);
  process.exit(1);
}
console.log("\nAll canonical data valid ✓");
