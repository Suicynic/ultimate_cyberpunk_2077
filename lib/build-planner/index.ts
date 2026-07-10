import { perkById, progressionRules, relicPerkById } from "@/data/build";
import type { AttributeId, Build } from "@/types/domain";

/**
 * Build-planner constraint validation — pure and unit-tested.
 * Progression rules come from data (with sources), not hard-coded numbers.
 */

export const ATTRIBUTE_IDS: AttributeId[] = [
  "body",
  "reflexes",
  "technical_ability",
  "intelligence",
  "cool",
];

export interface BuildValidation {
  attributePointsSpent: number;
  attributePointsAvailable: number;
  attributePointsRemaining: number;
  perkPointsSpent: number;
  relicPointsSpent: number;
  violations: string[];
  valid: boolean;
}

/** Total attribute points allocatable at a given character level. */
export function attributePointsAtLevel(level: number): number {
  const r = progressionRules;
  const effectiveLevel = Math.min(Math.max(level, 1), r.attributePointCapLevel);
  return r.creationPoints + (effectiveLevel - 1) * r.pointPerLevel;
}

export function validateBuild(build: Build): BuildValidation {
  const r = progressionRules;
  const violations: string[] = [];

  let spent = 0;
  for (const attr of ATTRIBUTE_IDS) {
    const value = build.attributes[attr];
    if (value < r.attributeMin || value > r.attributeMax) {
      violations.push(`${attr} must be between ${r.attributeMin} and ${r.attributeMax}.`);
    }
    spent += value - r.attributeMin;
  }

  const available = attributePointsAtLevel(build.targetLevel);
  if (spent > available) {
    violations.push(
      `Attribute allocation uses ${spent} points but only ${available} are available at level ${build.targetLevel}.`,
    );
  }

  const maxLevel = r.maxLevelPhantomLiberty;
  if (build.targetLevel < 1 || build.targetLevel > maxLevel) {
    violations.push(`Target level must be between 1 and ${maxLevel}.`);
  }

  let perkPointsSpent = 0;
  for (const [perkId, rank] of Object.entries(build.perks)) {
    const def = perkById.get(perkId);
    if (!def) {
      violations.push(`Unknown perk: ${perkId}.`);
      continue;
    }
    perkPointsSpent += rank;
    if (rank > def.maxRank) {
      violations.push(`${def.name} exceeds its maximum rank of ${def.maxRank}.`);
    }
    const attrValue = build.attributes[def.attribute];
    if (attrValue < def.requiredAttribute) {
      violations.push(
        `${def.name} requires ${def.requiredAttribute} ${def.attribute.replace(/_/g, " ")} (build has ${attrValue}).`,
      );
    }
    for (const reqId of def.requiresPerkIds ?? []) {
      if (!build.perks[reqId]) {
        const reqName = perkById.get(reqId)?.name ?? reqId;
        violations.push(`${def.name} requires the perk "${reqName}" first.`);
      }
    }
  }

  return {
    attributePointsSpent: spent,
    attributePointsAvailable: available,
    attributePointsRemaining: Math.max(0, available - spent),
    perkPointsSpent,
    relicPointsSpent: build.relicPerks.reduce(
      (sum, id) => sum + (relicPerkById.get(id)?.cost ?? 0),
      0,
    ),
    violations,
    valid: violations.length === 0,
  };
}

/** Encode a build into a URL-safe string for shareable build links. */
export function encodeBuildToUrlParam(build: Build): string {
  const payload = {
    n: build.name,
    v: build.gameVersion,
    l: build.targetLevel,
    a: build.attributes,
    p: build.perks,
    r: build.relicPerks,
    t: build.tags,
  };
  const json = JSON.stringify(payload);
  // btoa handles binary strings only — encode UTF-8 via TextEncoder first.
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return encodeURIComponent(btoa(binary));
}

export function decodeBuildFromUrlParam(param: string): Partial<Build> | null {
  try {
    const binary = atob(decodeURIComponent(param));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json) as {
      n?: string;
      v?: string;
      l?: number;
      a?: Build["attributes"];
      p?: Build["perks"];
      r?: string[];
      t?: string[];
    };
    if (!payload.a || !payload.p) return null;
    return {
      name: payload.n,
      gameVersion: payload.v,
      targetLevel: payload.l,
      attributes: payload.a,
      perks: payload.p,
      relicPerks: payload.r ?? [],
      tags: payload.t ?? [],
    };
  } catch {
    return null;
  }
}

export const BUILD_TAGS = [
  "Netrunner",
  "Solo",
  "Shinobi",
  "Engineer",
  "Gunslinger",
  "Stealth",
  "Blades",
  "Gorilla Arms",
  "Smart Weapons",
  "Tech Weapons",
  "Sandevistan",
  "Berserk",
  "Hybrid",
] as const;
