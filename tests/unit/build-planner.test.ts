import { describe, expect, it } from "vitest";
import {
  attributePointsAtLevel,
  decodeBuildFromUrlParam,
  encodeBuildToUrlParam,
  validateBuild,
} from "@/lib/build-planner";
import { progressionRules } from "@/data/build";
import type { Build } from "@/types/domain";

const base = (overrides: Partial<Build> = {}): Build => ({
  id: "build_test",
  name: "Test",
  gameVersion: "2.3",
  targetLevel: 50,
  attributes: { body: 3, reflexes: 3, technical_ability: 3, intelligence: 3, cool: 3 },
  perks: {},
  relicPerks: [],
  equipment: { weapons: [], cyberware: [], quickhacks: [], clothing: [], vehicles: [] },
  tags: [],
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

describe("attributePointsAtLevel", () => {
  it("grants creation points at level 1", () => {
    expect(attributePointsAtLevel(1)).toBe(progressionRules.creationPoints);
  });

  it("adds one point per level", () => {
    expect(attributePointsAtLevel(10)).toBe(progressionRules.creationPoints + 9);
  });

  it("stops accruing at the cap level", () => {
    expect(attributePointsAtLevel(60)).toBe(
      attributePointsAtLevel(progressionRules.attributePointCapLevel),
    );
  });
});

describe("validateBuild", () => {
  it("accepts a fresh build", () => {
    const v = validateBuild(base());
    expect(v.valid).toBe(true);
    expect(v.attributePointsSpent).toBe(0);
  });

  it("flags overspent attributes at low level", () => {
    const v = validateBuild(
      base({
        targetLevel: 1,
        attributes: { body: 20, reflexes: 20, technical_ability: 3, intelligence: 3, cool: 3 },
      }),
    );
    expect(v.valid).toBe(false);
    expect(v.violations.some((m) => m.includes("Attribute allocation"))).toBe(true);
  });

  it("flags perks whose attribute gate is unmet", () => {
    const v = validateBuild(base({ perks: { "perk:edgerunner": 1 } }));
    expect(v.valid).toBe(false);
    expect(v.violations.some((m) => m.toLowerCase().includes("requires 20"))).toBe(true);
  });

  it("flags missing perk prerequisites", () => {
    const v = validateBuild(
      base({
        attributes: { body: 3, reflexes: 3, technical_ability: 20, intelligence: 3, cool: 3 },
        perks: { "perk:edgerunner": 1 },
      }),
    );
    expect(v.violations.some((m) => m.includes("License to Chrome"))).toBe(true);
  });

  it("accepts a valid perk chain", () => {
    const v = validateBuild(
      base({
        attributes: { body: 3, reflexes: 3, technical_ability: 20, intelligence: 3, cool: 3 },
        perks: { "perk:license-to-chrome": 1, "perk:edgerunner": 1 },
      }),
    );
    expect(v.valid).toBe(true);
    expect(v.perkPointsSpent).toBe(2);
  });

  it("rejects unknown perks", () => {
    const v = validateBuild(base({ perks: { "perk:does-not-exist": 1 } }));
    expect(v.violations.some((m) => m.includes("Unknown perk"))).toBe(true);
  });
});

describe("build share URLs", () => {
  it("round-trips a build through the URL param", () => {
    const build = base({
      name: "Netrunner — 'Bartmoss' spec",
      attributes: { body: 3, reflexes: 6, technical_ability: 9, intelligence: 20, cool: 4 },
      perks: { "perk:overclock": 1 },
      relicPerks: ["relic:jailbreak"],
      tags: ["Netrunner"],
    });
    const decoded = decodeBuildFromUrlParam(encodeBuildToUrlParam(build));
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(build.name);
    expect(decoded?.attributes).toEqual(build.attributes);
    expect(decoded?.perks).toEqual(build.perks);
    expect(decoded?.relicPerks).toEqual(build.relicPerks);
  });

  it("returns null for garbage input", () => {
    expect(decodeBuildFromUrlParam("not-base64!!!")).toBeNull();
    expect(decodeBuildFromUrlParam(btoa("{}"))).toBeNull();
  });
});
