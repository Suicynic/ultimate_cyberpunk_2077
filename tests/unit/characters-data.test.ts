import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { characters, characterById, characterBySlug } from "@/data/characters";
import { factions, factionById } from "@/data/factions";
import { jobs } from "@/data/jobs";

const jobIds = new Set(jobs.map((j) => j.id));

/** The task's mandated minimum roster (by slug). */
const REQUIRED_SLUGS = [
  // Core
  "v",
  "johnny-silverhand",
  "jackie-welles",
  "viktor-vektor",
  "misty-olszewski",
  "t-bug",
  "dexter-deshawn",
  "evelyn-parker",
  // Major relationship & quest
  "judy-alvarez",
  "panam-palmer",
  "river-ward",
  "kerry-eurodyne",
  "rogue-amendiares",
  "goro-takemura",
  "alt-cunningham",
  "hanako-arasaka",
  "yorinobu-arasaka",
  "mama-welles",
  "claire-russell",
  "delamain",
  // Fixers & NC figures
  "regina-jones",
  "wakako-okada",
  "padre",
  "el-capitan",
  "dino-dinovic",
  "dakota-smith",
  "mr-hands",
  "meredith-stout",
  // Faction figures
  "saul-bright",
  "mitch-anderson",
  "placide",
  "brigitte",
  "anders-hellman",
  "lizzy-wizzy",
  // Phantom Liberty
  "song-so-mi",
  "solomon-reed",
  "rosalind-myers",
  "alex",
  "kurt-hansen",
];

describe("character dataset integrity", () => {
  it("includes at least the mandated roster", () => {
    for (const slug of REQUIRED_SLUGS) {
      expect(characterBySlug.has(slug), `missing character ${slug}`).toBe(true);
    }
  });

  it("has unique ids, slugs and archive ids", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const archiveIds = new Set<string>();
    for (const c of characters) {
      expect(ids.has(c.id), `duplicate id ${c.id}`).toBe(false);
      expect(slugs.has(c.slug), `duplicate slug ${c.slug}`).toBe(false);
      expect(archiveIds.has(c.archiveId), `duplicate archiveId ${c.archiveId}`).toBe(false);
      ids.add(c.id);
      slugs.add(c.slug);
      archiveIds.add(c.archiveId);
    }
  });

  it("keeps id and slug in sync", () => {
    for (const c of characters) {
      expect(c.id).toBe(`character:${c.slug}`);
    }
  });

  it("resolves all related-character references", () => {
    for (const c of characters) {
      for (const ref of c.relatedCharacterIds ?? []) {
        expect(characterById.has(ref), `${c.id} → ${ref}`).toBe(true);
      }
    }
  });

  it("resolves all related-faction references", () => {
    for (const c of characters) {
      for (const ref of c.relatedFactionIds ?? []) {
        expect(factionById.has(ref), `${c.id} → ${ref}`).toBe(true);
      }
    }
  });

  it("resolves all relevant-job references", () => {
    for (const c of characters) {
      for (const ref of c.firstRelevantJobIds ?? []) {
        expect(jobIds.has(ref), `${c.id} → ${ref}`).toBe(true);
      }
    }
  });

  it("keeps spoiler classification internally consistent", () => {
    for (const c of characters) {
      if (c.spoilerBiography) {
        expect(c.spoilerLevel, `${c.id} has a spoiler bio but level "none"`).not.toBe("none");
      } else {
        expect(c.spoilerLevel, `${c.id} has level ${c.spoilerLevel} but no spoiler bio`).toBe(
          "none",
        );
      }
    }
  });

  it("only references portrait assets that exist locally", () => {
    for (const c of characters) {
      if (!c.portrait) continue;
      const abs = path.join(process.cwd(), "public", c.portrait.replace(/^\//, ""));
      expect(existsSync(abs), `${c.id} portrait ${c.portrait} missing`).toBe(true);
    }
  });

  it("resolves valid slugs and rejects invalid ones", () => {
    expect(characterBySlug.get("panam-palmer")?.name).toBe("Panam Palmer");
    expect(characterBySlug.get("not-a-real-character")).toBeUndefined();
  });
});

describe("faction dataset integrity", () => {
  it("has unique ids", () => {
    const ids = new Set<string>();
    for (const f of factions) {
      expect(ids.has(f.id), `duplicate id ${f.id}`).toBe(false);
      ids.add(f.id);
    }
  });
});
