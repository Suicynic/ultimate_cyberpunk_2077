import type { CanonicalMeta, FactionDef, VerificationStatus } from "@/types/domain";
import { ACCESSED, SRC_WIKI } from "@/data/sources/common";

/**
 * Factions referenced by the Character Archive. Factions are not spoilers —
 * descriptions are spoiler-safe paraphrases in original wording (see
 * DATA_SOURCES.md) and every record cites a source.
 */

const meta = (
  page: string,
  title: string,
  opts?: { verification?: VerificationStatus; expansion?: "base" | "phantom_liberty" },
): CanonicalMeta => ({
  gameVersion: "2.3",
  expansion: opts?.expansion ?? "base",
  lastVerified: ACCESSED,
  verification: opts?.verification ?? "community_verified",
  sources: [SRC_WIKI(page, title)],
});

export const factions: FactionDef[] = [
  {
    id: "faction:arasaka",
    name: "Arasaka",
    category: "corporation",
    description:
      "Japan-founded megacorporation with a dominant presence in Night City. Spans banking, manufacturing and private security, and casts a long shadow over the city's politics.",
    location: "City Center",
    meta: meta("Arasaka", "Arasaka"),
  },
  {
    id: "faction:militech",
    name: "Militech",
    category: "corporation",
    description:
      "American arms-and-security megacorp and Arasaka's chief rival, supplying weapons, vehicles and military contractors across the setting.",
    meta: meta("Militech", "Militech"),
  },
  {
    id: "faction:trauma-team",
    name: "Trauma Team",
    shortName: "TT",
    category: "corporation",
    description:
      "Premium emergency-medical corporation. Subscribers get an armed rapid-response crew that will fight through a firefight to reach a covered client.",
    meta: meta("Trauma_Team_International", "Trauma Team"),
  },
  {
    id: "faction:netwatch",
    name: "NetWatch",
    category: "organization",
    description:
      "Watchdog organization that polices the Net, maintaining the barrier against rogue AIs beyond the Blackwall and hunting unsanctioned netrunners.",
    meta: meta("NetWatch", "NetWatch"),
  },
  {
    id: "faction:aldecaldos",
    name: "Aldecaldos",
    category: "nomad",
    description:
      "Nomad family living out in the Badlands. Tight-knit and mobile, they favor loyalty and self-reliance over corporate life.",
    location: "Badlands",
    meta: meta("Aldecaldos", "Aldecaldos"),
  },
  {
    id: "faction:voodoo-boys",
    name: "Voodoo Boys",
    category: "gang",
    description:
      "Haitian netrunner collective based in Pacifica, obsessed with the deep Net and what lies past the Blackwall.",
    location: "Pacifica",
    meta: meta("Voodoo_Boys", "Voodoo Boys"),
  },
  {
    id: "faction:valentinos",
    name: "Valentinos",
    category: "gang",
    description:
      "Large Latino gang rooted in Heywood, bound by tradition, faith and a strong code of honor among members.",
    location: "Heywood",
    meta: meta("Valentinos", "Valentinos"),
  },
  {
    id: "faction:maelstrom",
    name: "Maelstrom",
    category: "gang",
    description:
      "Watson gang defined by extreme cyberware modification, pushing chrome past the point most people consider sane.",
    location: "Watson",
    meta: meta("Maelstrom", "Maelstrom"),
  },
  {
    id: "faction:tyger-claws",
    name: "Tyger Claws",
    category: "gang",
    description:
      "Japantown gang with deep roots in Westbrook's nightlife and entertainment rackets, known for their bikes and blades.",
    location: "Westbrook",
    meta: meta("Tyger_Claws", "Tyger Claws"),
  },
  {
    id: "faction:sixth-street",
    name: "6th Street",
    shortName: "6SG",
    category: "gang",
    description:
      "Veteran-founded gang in Santo Domingo that styles itself as a neighborhood militia, heavy on guns and patriotic bravado.",
    location: "Santo Domingo",
    meta: meta("6th_Street", "6th Street"),
  },
  {
    id: "faction:moxes",
    name: "The Mox",
    shortName: "Moxes",
    category: "gang",
    description:
      "Protective crew formed to look after sex workers and the vulnerable, operating out of clubs like Lizzie's Bar.",
    location: "Watson",
    meta: meta("The_Mox", "The Mox"),
  },
  {
    id: "faction:animals",
    name: "Animals",
    category: "gang",
    description:
      "Gang built around raw physical augmentation and combat drugs, favoring overwhelming strength over chrome or guns.",
    meta: meta("Animals", "Animals"),
  },
  {
    id: "faction:ncpd",
    name: "Night City Police Department",
    shortName: "NCPD",
    category: "government",
    description:
      "The city's overstretched police force, stretched thin across districts and often outgunned by gangs and corporate security.",
    meta: meta("Night_City_Police_Department", "NCPD"),
  },
  {
    id: "faction:barghest",
    name: "Barghest",
    category: "organization",
    description:
      "Paramilitary outfit that controls the walled-off district of Dogtown under its own strongman leadership.",
    location: "Dogtown",
    meta: meta("Barghest", "Barghest", { expansion: "phantom_liberty" }),
  },
  {
    id: "faction:fia",
    name: "Federal Intelligence Agency",
    shortName: "FIA",
    category: "government",
    description:
      "Intelligence service of the New United States, running covert operations that reach into Night City and Dogtown.",
    meta: meta("Federal_Intelligence_Agency", "FIA", { expansion: "phantom_liberty" }),
  },
];

export const factionById = new Map(factions.map((f) => [f.id, f]));
