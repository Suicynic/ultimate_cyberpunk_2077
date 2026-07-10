import type {
  AttributeDef,
  CanonicalMeta,
  PerkDef,
  RelicPerkDef,
  VerificationStatus,
} from "@/types/domain";
import { ACCESSED, SRC_WIKI } from "@/data/sources/common";

/**
 * Build-planner reference data for the 2.x systems overhaul.
 *
 * The starter set is deliberately small: a few well-known perks per attribute
 * to prove the tier gates, prerequisites, ranks, and expansion labeling.
 * Effect summaries are qualitative on purpose — no invented numbers.
 */

const meta = (
  page: string,
  title: string,
  verification: VerificationStatus = "community_verified",
  expansion: "base" | "phantom_liberty" = "base",
): CanonicalMeta => ({
  gameVersion: "2.3",
  expansion,
  lastVerified: ACCESSED,
  verification,
  sources: [SRC_WIKI(page, title)],
});

export const attributes: AttributeDef[] = [
  {
    id: "body",
    name: "Body",
    description:
      "Raw physicality: health, stamina, blunt weapons, shotguns and LMGs, and forcing doors.",
    meta: meta("Body_(2077)", "Body attribute"),
  },
  {
    id: "reflexes",
    name: "Reflexes",
    description: "Mobility and speed: dodging, dashing, blades, assault rifles and SMGs.",
    meta: meta("Reflexes_(2077)", "Reflexes attribute"),
  },
  {
    id: "technical_ability",
    name: "Technical Ability",
    description: "Engineering: cyberware capacity and quality, tech weapons, grenades, devices.",
    meta: meta("Technical_Ability_(2077)", "Technical Ability attribute"),
  },
  {
    id: "intelligence",
    name: "Intelligence",
    description: "Netrunning: quickhacks, RAM, smart weapons, and breach protocols.",
    meta: meta("Intelligence_(2077)", "Intelligence attribute"),
  },
  {
    id: "cool",
    name: "Cool",
    description:
      "Composure under pressure: stealth, critical strikes, sniper rifles, pistols, throwables.",
    meta: meta("Cool_(2077)", "Cool attribute"),
  },
];

/**
 * Character progression rules used by the planner (2.x).
 * Encoded as data (with a source) rather than hard-coded logic so a patch
 * can update them without an application rewrite.
 */
export const progressionRules = {
  gameVersion: "2.3",
  attributeMin: 3,
  attributeMax: 20,
  /** Points available to distribute at character creation. */
  creationPoints: 7,
  /** One attribute point is gained per character level after level 1… */
  pointPerLevel: 1,
  /** …up to this level (attribute points stop accruing here). */
  attributePointCapLevel: 50,
  maxLevelBase: 50,
  maxLevelPhantomLiberty: 60,
  meta: meta(
    "Attributes_(2077)",
    "Attributes and character progression",
    "community_verified",
  ) satisfies CanonicalMeta,
};

export const perks: PerkDef[] = [
  // Body
  {
    id: "perk:painkiller",
    name: "Painkiller",
    attribute: "body",
    requiredAttribute: 4,
    maxRank: 1,
    effectSummary: "Slowly regenerate health during combat.",
    expansion: "base",
    meta: meta("Painkiller_(2077)", "Painkiller perk"),
  },
  {
    id: "perk:die-die-die",
    name: "Die! Die! Die!",
    attribute: "body",
    requiredAttribute: 9,
    maxRank: 1,
    effectSummary: "Improves shotgun, LMG and HMG effectiveness against staggered enemies.",
    expansion: "base",
    meta: meta("Die!_Die!_Die!", "Die! Die! Die! perk", "unverified"),
  },
  {
    id: "perk:adrenaline-rush",
    name: "Adrenaline Rush",
    attribute: "body",
    requiredAttribute: 15,
    maxRank: 1,
    effectSummary:
      "Health items grant temporary bonus max health that decays over time, rewarding aggressive play.",
    expansion: "base",
    meta: meta("Adrenaline_Rush_(2077)", "Adrenaline Rush perk"),
  },
  // Reflexes
  {
    id: "perk:slippery",
    name: "Slippery",
    attribute: "reflexes",
    requiredAttribute: 4,
    maxRank: 1,
    effectSummary: "Harder for enemies to hit you while you are moving.",
    expansion: "base",
    meta: meta("Slippery_(2077)", "Slippery perk"),
  },
  {
    id: "perk:dash",
    name: "Dash",
    attribute: "reflexes",
    requiredAttribute: 9,
    maxRank: 1,
    effectSummary: "Replaces dodge with a longer dash that can be chained into slides and jumps.",
    expansion: "base",
    meta: meta("Dash_(2077)", "Dash perk"),
  },
  {
    id: "perk:air-dash",
    name: "Air Dash",
    attribute: "reflexes",
    requiredAttribute: 15,
    maxRank: 1,
    requiresPerkIds: ["perk:dash"],
    effectSummary: "Dash while airborne — a core mobility unlock for movement-focused builds.",
    expansion: "base",
    meta: meta("Air_Dash", "Air Dash perk"),
  },
  // Technical Ability
  {
    id: "perk:bolt",
    name: "Bolt",
    attribute: "technical_ability",
    requiredAttribute: 9,
    maxRank: 1,
    effectSummary: "Perfectly-timed tech weapon charges fire a faster, harder-hitting bolt.",
    expansion: "base",
    meta: meta("Bolt_(2077)", "Bolt perk", "unverified"),
  },
  {
    id: "perk:license-to-chrome",
    name: "License to Chrome",
    attribute: "technical_ability",
    requiredAttribute: 15,
    maxRank: 1,
    effectSummary: "Increases cyberware capacity and unlocks stronger armor from chrome.",
    expansion: "base",
    meta: meta("License_to_Chrome", "License to Chrome perk"),
  },
  {
    id: "perk:edgerunner",
    name: "Edgerunner",
    attribute: "technical_ability",
    requiredAttribute: 20,
    maxRank: 1,
    requiresPerkIds: ["perk:license-to-chrome"],
    effectSummary:
      "Push past your cyberware capacity for extra power at the cost of stability — the signature 20-Tech perk.",
    expansion: "base",
    meta: meta("Edgerunner_(perk)", "Edgerunner perk"),
  },
  // Intelligence
  {
    id: "perk:eye-in-the-sky",
    name: "Eye in the Sky",
    attribute: "intelligence",
    requiredAttribute: 4,
    maxRank: 1,
    effectSummary: "Improves camera access and control while netrunning from a distance.",
    expansion: "base",
    meta: meta("Eye_in_the_Sky", "Eye in the Sky perk", "unverified"),
  },
  {
    id: "perk:queue-mastery",
    name: "Queue Mastery",
    attribute: "intelligence",
    requiredAttribute: 15,
    maxRank: 1,
    effectSummary: "Upload more quickhacks to a target simultaneously.",
    expansion: "base",
    meta: meta("Queue_Mastery", "Queue Mastery perk", "unverified"),
  },
  {
    id: "perk:overclock",
    name: "Overclock",
    attribute: "intelligence",
    requiredAttribute: 20,
    maxRank: 1,
    effectSummary:
      "When RAM runs dry, spend health to keep casting quickhacks — the signature 20-Int perk.",
    expansion: "base",
    meta: meta("Overclock_(2077)", "Overclock perk"),
  },
  // Cool
  {
    id: "perk:killer-instinct",
    name: "Killer Instinct",
    attribute: "cool",
    requiredAttribute: 4,
    maxRank: 1,
    effectSummary: "Deal more damage from stealth before combat starts.",
    expansion: "base",
    meta: meta("Killer_Instinct_(2077)", "Killer Instinct perk", "unverified"),
  },
  {
    id: "perk:focus",
    name: "Focus",
    attribute: "cool",
    requiredAttribute: 9,
    maxRank: 1,
    effectSummary: "Aiming with rifles and pistols steadies time briefly at the cost of stamina.",
    expansion: "base",
    meta: meta("Focus_(2077)", "Focus perk", "unverified"),
  },
  {
    id: "perk:deadeye",
    name: "Deadeye",
    attribute: "cool",
    requiredAttribute: 15,
    maxRank: 1,
    requiresPerkIds: ["perk:focus"],
    effectSummary: "Greatly improves precision-weapon damage while stamina stays high.",
    expansion: "base",
    meta: meta("Deadeye", "Deadeye perk"),
  },
];

export const relicPerks: RelicPerkDef[] = [
  {
    id: "relic:jailbreak",
    name: "Jailbreak",
    cost: 3,
    effectSummary:
      "Unlocks hidden abilities in arm cyberware (gorilla arms, mantis blades, monowire, projectile launcher).",
    meta: meta("Jailbreak_(2077)", "Jailbreak relic perk", "community_verified", "phantom_liberty"),
  },
  {
    id: "relic:emergency-cloaking",
    name: "Emergency Cloaking",
    cost: 3,
    effectSummary: "Optical camo can be used to break line of sight and escape combat entirely.",
    meta: meta(
      "Emergency_Cloaking",
      "Emergency Cloaking relic perk",
      "community_verified",
      "phantom_liberty",
    ),
  },
  {
    id: "relic:vulnerability-analytics",
    name: "Vulnerability Analytics",
    cost: 3,
    effectSummary:
      "Reveals exploitable weak points on enemies in combat; hitting them triggers a damage surge.",
    meta: meta(
      "Vulnerability_Analytics",
      "Vulnerability Analytics relic perk",
      "community_verified",
      "phantom_liberty",
    ),
  },
];

export const perkById = new Map(perks.map((p) => [p.id, p]));
export const relicPerkById = new Map(relicPerks.map((p) => [p.id, p]));
