/**
 * Canonical dataset integrity — the same guarantees as scripts/validate-data,
 * enforced inside the unit-test gate as well.
 */
import { describe, expect, it } from "vitest";
import { achievements } from "@/data/achievements";
import { attributes, perks, relicPerks } from "@/data/build";
import { characters } from "@/data/characters";
import { collectibles } from "@/data/collections";
import { endings, relationships } from "@/data/endings";
import { factions } from "@/data/factions";
import { jobs } from "@/data/jobs";
import { mapMarkers } from "@/data/map";
import { resources } from "@/data/resources";
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
} from "@/lib/validation/schemas";

const suites = [
  ["jobs", jobs, jobDefSchema],
  ["achievements", achievements, achievementDefSchema],
  ["map markers", mapMarkers, mapMarkerDefSchema],
  ["attributes", attributes, attributeDefSchema],
  ["perks", perks, perkDefSchema],
  ["relic perks", relicPerks, relicPerkDefSchema],
  ["collectibles", collectibles, collectibleDefSchema],
  ["endings", endings, endingDefSchema],
  ["relationships", relationships, relationshipDefSchema],
  ["resources", resources, resourceDefSchema],
  ["factions", factions, factionDefSchema],
  ["characters", characters, characterDefSchema],
] as const;

describe("canonical datasets", () => {
  for (const [name, records, schema] of suites) {
    it(`${name} match their schema and have unique IDs`, () => {
      const ids = new Set<string>();
      for (const record of records as { id: string }[]) {
        const result = schema.safeParse(record);
        if (!result.success) {
          expect.fail(`${record.id}: ${result.error.issues[0]?.message}`);
        }
        expect(ids.has(record.id), `duplicate id ${record.id}`).toBe(false);
        ids.add(record.id);
      }
      expect(records.length).toBeGreaterThan(0);
    });
  }

  it("job prerequisites reference existing jobs", () => {
    const ids = new Set(jobs.map((j) => j.id));
    for (const job of jobs) {
      for (const p of job.prerequisites ?? []) {
        expect(ids.has(p), `${job.id} → ${p}`).toBe(true);
      }
    }
  });

  it("perk prerequisites reference existing perks", () => {
    const ids = new Set(perks.map((p) => p.id));
    for (const perk of perks) {
      for (const r of perk.requiresPerkIds ?? []) {
        expect(ids.has(r), `${perk.id} → ${r}`).toBe(true);
      }
    }
  });
});
