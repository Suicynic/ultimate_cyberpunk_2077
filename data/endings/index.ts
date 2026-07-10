import type { CanonicalMeta, EndingDef, RelationshipDef, VerificationStatus } from "@/types/domain";
import { ACCESSED, SRC_WIKI } from "@/data/sources/common";

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

/**
 * Endings are the most spoiler-sensitive dataset in the app. Codenames are
 * shown until the user reveals a record; names, summaries and requirements
 * stay behind the spoiler shield. Requirement confidence is labeled
 * confirmed / probable / disputed — never presented as one "correct" path.
 */
export const endings: EndingDef[] = [
  {
    id: "ending:the-devil",
    codename: "EPILOGUE //01",
    name: "The Devil",
    expansion: "base",
    summarySpoiler:
      "Trust Arasaka: accept Hanako's plan at Embers. V undergoes Mikoshi procedures at a cost that the epilogue makes painfully clear, ending with a contract decision in orbit.",
    requirements: [
      { text: "Reach Nocturne Op55N1 and choose to take Hanako's offer.", confidence: "confirmed" },
      {
        text: "Takemura can appear in this path's finale if he was rescued during Search and Destroy.",
        confidence: "confirmed",
      },
    ],
    relatedJobIds: ["job:nocturne-op55n1", "job:last-caress", "job:search-and-destroy"],
    meta: meta("The_Devil_(ending)", "The Devil ending"),
  },
  {
    id: "ending:the-star",
    codename: "EPILOGUE //02",
    name: "The Star",
    expansion: "base",
    summarySpoiler:
      "Leave with the Aldecaldos: Panam's clan cracks Mikoshi their own way, and V rides out of Night City with a found family — and an uncertain clock.",
    requirements: [
      {
        text: "Complete Panam's questline through Queen of the Highway before the point of no return.",
        confidence: "confirmed",
      },
      { text: "Choose to call Panam at the Nocturne Op55N1 rooftop.", confidence: "confirmed" },
    ],
    relatedJobIds: ["job:queen-of-the-highway", "job:we-gotta-live-together"],
    meta: meta("The_Star_(ending)", "The Star ending"),
  },
  {
    id: "ending:the-sun",
    codename: "EPILOGUE //03",
    name: "The Sun",
    expansion: "base",
    summarySpoiler:
      "Become a legend: after the Afterlife assault on Arasaka Tower (with Rogue, or alone via the secret route), V takes the Afterlife's chair and a job in orbit.",
    requirements: [
      {
        text: "Complete Rogue and Johnny's side jobs (Chippin' In → Blistering Love) to unlock the Rogue route.",
        confidence: "confirmed",
      },
      {
        text: "Alternatively reached via the secret Don't Fear the Reaper route.",
        confidence: "confirmed",
      },
    ],
    relatedJobIds: ["job:chippin-in", "job:blistering-love", "job:for-whom-the-bell-tolls"],
    meta: meta("The_Sun_(ending)", "The Sun ending"),
  },
  {
    id: "ending:temperance",
    codename: "EPILOGUE //04",
    name: "Temperance",
    expansion: "base",
    summarySpoiler:
      "Johnny keeps the body: available when V lets Johnny take over for the final assault and then crosses the bridge in Mikoshi. Johnny leaves Night City by bus.",
    requirements: [
      {
        text: "Choose a path where Johnny takes V's body for the finale, then confirm the choice in Mikoshi.",
        confidence: "confirmed",
      },
    ],
    relatedJobIds: ["job:for-whom-the-bell-tolls"],
    meta: meta("Temperance_(ending)", "Temperance ending"),
  },
  {
    id: "ending:path-of-least-resistance",
    codename: "EPILOGUE //00",
    name: "Path of Least Resistance",
    expansion: "base",
    summarySpoiler:
      "The rooftop surrender: V throws the pills away and ends things on their own terms. Short, bleak, and available from the Nocturne Op55N1 rooftop itself.",
    requirements: [
      {
        text: "Choose the pill-toss option during the rooftop conversation.",
        confidence: "confirmed",
      },
    ],
    relatedJobIds: ["job:nocturne-op55n1"],
    meta: meta("Path_of_Least_Resistance_(ending)", "Path of Least Resistance"),
  },
  {
    id: "ending:dont-fear-the-reaper",
    codename: "EPILOGUE //??",
    name: "Don't Fear the Reaper (secret)",
    expansion: "base",
    summarySpoiler:
      "The solo raid: V storms Arasaka Tower alone. Unlocked by a hidden dialogue option on the rooftop; failure here is permanent within the attempt.",
    requirements: [
      {
        text: "During Chippin' In, take the conciliatory oath-taking dialogue path with Johnny at the oilfields.",
        confidence: "probable",
      },
      {
        text: "Wait silently for several minutes when Johnny proposes his plan on the rooftop.",
        confidence: "confirmed",
      },
      {
        text: "A minimum V–Johnny relationship percentage is required; exact threshold is disputed in the community.",
        confidence: "disputed",
      },
    ],
    relatedJobIds: ["job:chippin-in", "job:nocturne-op55n1"],
    meta: meta("(Don%27t_Fear)_The_Reaper", "Don't Fear the Reaper"),
  },
  {
    id: "ending:the-tower",
    codename: "EPILOGUE //PL",
    name: "The Tower (Phantom Liberty)",
    expansion: "phantom_liberty",
    summarySpoiler:
      "The cure: an ending added by Phantom Liberty in which V trades everything for a chance to live. Unlocked by a specific resolution of the expansion's final arc.",
    requirements: [
      {
        text: "Complete the Somewhat Damaged arc with the choice that hands Songbird over for study.",
        confidence: "probable",
      },
      {
        text: "Answer the follow-up call and accept the offer after the expansion's finale.",
        confidence: "confirmed",
      },
    ],
    relatedJobIds: ["job:firestarter", "job:somewhat-damaged"],
    meta: meta("The_Tower_(ending)", "The Tower ending", { expansion: "phantom_liberty" }),
  },
];

export const relationships: RelationshipDef[] = [
  {
    id: "rel:panam",
    characterName: "Panam Palmer",
    kind: "romance",
    availability: "Romance available to V with a masculine body type and voice.",
    relatedJobIds: [
      "job:riders-on-the-storm",
      "job:with-a-little-help",
      "job:queen-of-the-highway",
    ],
    spoilerLevel: "minor",
    meta: meta("Panam_Palmer", "Panam Palmer"),
  },
  {
    id: "rel:judy",
    characterName: "Judy Alvarez",
    kind: "romance",
    availability: "Romance available to V with a feminine body type and voice.",
    relatedJobIds: ["job:both-sides-now", "job:pyramid-song"],
    spoilerLevel: "minor",
    meta: meta("Judy_Alvarez", "Judy Alvarez"),
  },
  {
    id: "rel:river",
    characterName: "River Ward",
    kind: "romance",
    availability: "Romance available to V with a feminine body type.",
    relatedJobIds: ["job:i-fought-the-law", "job:the-hunt"],
    spoilerLevel: "minor",
    meta: meta("River_Ward", "River Ward"),
  },
  {
    id: "rel:kerry",
    characterName: "Kerry Eurodyne",
    kind: "romance",
    availability: "Romance available to V with a masculine body type.",
    relatedJobIds: ["job:chippin-in"],
    spoilerLevel: "minor",
    meta: meta("Kerry_Eurodyne", "Kerry Eurodyne"),
  },
  {
    id: "rel:johnny",
    characterName: "Johnny Silverhand",
    kind: "companion",
    availability:
      "Not a romance. The V–Johnny relationship percentage shifts with dialogue and side jobs and gates the secret ending.",
    relatedJobIds: ["job:chippin-in", "job:blistering-love"],
    spoilerLevel: "major",
    meta: meta("Johnny_Silverhand", "Johnny Silverhand"),
  },
];

export const endingById = new Map(endings.map((e) => [e.id, e]));
export const relationshipById = new Map(relationships.map((r) => [r.id, r]));
