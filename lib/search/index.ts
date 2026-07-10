import Fuse from "fuse.js";
import { achievements } from "@/data/achievements";
import { collectibles } from "@/data/collections";
import { endings } from "@/data/endings";
import { jobs } from "@/data/jobs";
import { mapMarkers } from "@/data/map";
import { perks } from "@/data/build";
import { resources } from "@/data/resources";
import type { SpoilerLevel } from "@/types/domain";

/**
 * Client-side global search over canonical records.
 * User records (notes, builds, playthroughs) are appended at query time by
 * the command palette, since they live in IndexedDB.
 */

export type SearchDocType =
  | "job"
  | "achievement"
  | "marker"
  | "collectible"
  | "ending"
  | "perk"
  | "resource"
  | "note"
  | "build"
  | "playthrough";

export interface SearchDoc {
  id: string;
  type: SearchDocType;
  title: string;
  subtitle?: string;
  /** Route the palette navigates to. */
  href: string;
  spoilerLevel: SpoilerLevel;
  keywords?: string;
}

export function buildCanonicalSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const j of jobs) {
    docs.push({
      id: j.id,
      type: "job",
      title: j.name,
      subtitle: j.category === "main" ? "Main job" : j.category,
      href: `/jobs?focus=${encodeURIComponent(j.id)}`,
      spoilerLevel: j.spoilerLevel,
      keywords: [j.questline, j.questGiver, j.district].filter(Boolean).join(" "),
    });
  }
  for (const a of achievements) {
    docs.push({
      id: a.id,
      type: "achievement",
      title: a.name,
      subtitle: "Achievement",
      href: `/achievements?focus=${encodeURIComponent(a.id)}`,
      spoilerLevel: a.spoilerLevel,
    });
  }
  for (const m of mapMarkers) {
    docs.push({
      id: m.id,
      type: "marker",
      title: m.name,
      subtitle: `Map — ${m.district.replace(/_/g, " ")}`,
      href: `/map?focus=${encodeURIComponent(m.id)}`,
      spoilerLevel: m.spoilerLevel,
    });
  }
  for (const c of collectibles) {
    docs.push({
      id: c.id,
      type: "collectible",
      title: c.name,
      subtitle: c.type.replace(/_/g, " "),
      href: `/collections?focus=${encodeURIComponent(c.id)}`,
      spoilerLevel: c.spoilerLevel,
    });
  }
  for (const e of endings) {
    docs.push({
      id: e.id,
      type: "ending",
      // Endings are indexed by codename only — real names never leak
      // through search results.
      title: e.codename,
      subtitle: "Ending",
      href: `/endings`,
      spoilerLevel: "endgame",
    });
  }
  for (const p of perks) {
    docs.push({
      id: p.id,
      type: "perk",
      title: p.name,
      subtitle: `Perk — ${p.attribute.replace(/_/g, " ")}`,
      href: `/builds`,
      spoilerLevel: "none",
    });
  }
  for (const r of resources) {
    docs.push({
      id: r.id,
      type: "resource",
      title: r.title,
      subtitle: `Resource — ${r.publisher}`,
      href: `/resources?focus=${encodeURIComponent(r.id)}`,
      spoilerLevel: "none",
    });
  }
  return docs;
}

export function createSearchIndex(docs: SearchDoc[]): Fuse<SearchDoc> {
  return new Fuse(docs, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "subtitle", weight: 0.15 },
      { name: "keywords", weight: 0.15 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
  });
}
