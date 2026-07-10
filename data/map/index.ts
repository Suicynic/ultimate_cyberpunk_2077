import type { CanonicalMeta, District, MapMarkerDef, VerificationStatus } from "@/types/domain";
import { ACCESSED, SRC_WIKI } from "@/data/sources/common";

/**
 * Starter marker set for the original schematic map.
 *
 * Coordinates are normalized (0–100) positions on the app's own abstract
 * district diagram — deliberately approximate, original artwork, and clearly
 * labeled as schematic in the UI. The map layer is architected so licensed or
 * community-permitted tile sets with true coordinate systems can be added
 * later (see docs/architecture/map.md).
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

/** Schematic bounding boxes for the original district diagram (0–100 grid). */
export const districtShapes: Record<
  District,
  { label: string; points: [number, number][]; labelAt: [number, number] }
> = {
  watson: {
    label: "Watson",
    points: [
      [34, 6],
      [58, 8],
      [60, 24],
      [52, 36],
      [36, 34],
      [30, 18],
    ],
    labelAt: [45, 20],
  },
  westbrook: {
    label: "Westbrook",
    points: [
      [60, 24],
      [84, 22],
      [88, 42],
      [66, 48],
      [56, 38],
    ],
    labelAt: [72, 35],
  },
  city_center: {
    label: "City Center",
    points: [
      [40, 38],
      [56, 40],
      [62, 52],
      [50, 58],
      [38, 52],
    ],
    labelAt: [49, 48],
  },
  heywood: {
    label: "Heywood",
    points: [
      [34, 54],
      [50, 60],
      [58, 70],
      [42, 76],
      [30, 66],
    ],
    labelAt: [43, 66],
  },
  santo_domingo: {
    label: "Santo Domingo",
    points: [
      [62, 52],
      [86, 48],
      [90, 68],
      [70, 74],
      [58, 68],
    ],
    labelAt: [74, 61],
  },
  pacifica: {
    label: "Pacifica",
    points: [
      [24, 72],
      [42, 78],
      [46, 92],
      [26, 94],
      [18, 82],
    ],
    labelAt: [32, 84],
  },
  dogtown: {
    label: "Dogtown",
    points: [
      [46, 80],
      [62, 78],
      [66, 92],
      [50, 96],
    ],
    labelAt: [56, 87],
  },
  badlands: {
    label: "Badlands",
    points: [
      [4, 10],
      [26, 12],
      [22, 60],
      [10, 88],
      [2, 70],
    ],
    labelAt: [13, 42],
  },
};

export const mapMarkers: MapMarkerDef[] = [
  // Fast travel / landmarks
  {
    id: "marker:megabuilding-h10",
    name: "Megabuilding H10",
    category: "fast_travel",
    x: 40,
    y: 22,
    district: "watson",
    description: "V's starting apartment block in Little China.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Megabuilding_H10", "Megabuilding H10"),
  },
  {
    id: "marker:afterlife",
    name: "Afterlife",
    category: "vendor",
    x: 46,
    y: 16,
    district: "watson",
    description: "The legendary merc bar run by Rogue — hub for high-end fixer work.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Afterlife", "Afterlife bar"),
  },
  {
    id: "marker:lizzies-bar",
    name: "Lizzie's Bar",
    category: "vendor",
    x: 52,
    y: 14,
    district: "watson",
    description: "Mox territory in Kabuki. Judy's workshop is downstairs.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Lizzie%27s_Bar", "Lizzie's Bar"),
  },
  {
    id: "marker:corpo-plaza",
    name: "Corpo Plaza",
    category: "fast_travel",
    x: 50,
    y: 48,
    district: "city_center",
    description: "The corporate heart of Night City, beneath Arasaka Tower.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Corpo_Plaza", "Corpo Plaza"),
  },
  {
    id: "marker:sunset-motel",
    name: "Sunset Motel",
    category: "fast_travel",
    x: 14,
    y: 60,
    district: "badlands",
    description: "Badlands waypoint tied to several Panam jobs.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Sunset_Motel", "Sunset Motel"),
  },
  {
    id: "marker:ebm-stadium",
    name: "EBM Petrochem Stadium",
    category: "fast_travel",
    x: 55,
    y: 84,
    district: "dogtown",
    description: "Dogtown's fortified stadium — black market and Hansen's seat of power.",
    spoilerLevel: "none",
    expansion: "phantom_liberty",
    meta: meta("EBM_Petrochem_Stadium", "EBM Petrochem Stadium", {
      expansion: "phantom_liberty",
    }),
  },
  // Ripperdocs & vendors
  {
    id: "marker:viktors-clinic",
    name: "Viktor's Clinic",
    category: "ripperdoc",
    x: 42,
    y: 26,
    district: "watson",
    description: "Viktor Vektor's basement clinic in Little China.",
    spoilerLevel: "none",
    expansion: "base",
    relatedJobId: "job:the-ripperdoc",
    meta: meta("Viktor%27s_Clinic", "Viktor's Clinic"),
  },
  {
    id: "marker:fingers-clinic",
    name: "Fingers M.D.",
    category: "ripperdoc",
    x: 70,
    y: 40,
    district: "westbrook",
    description: "Jig-Jig Street ripperdoc with a unique inventory.",
    spoilerLevel: "minor",
    expansion: "base",
    relatedJobId: "job:the-space-in-between",
    meta: meta("Fingers_M.D.", "Fingers M.D."),
  },
  // Apartments
  {
    id: "marker:apt-japantown",
    name: "Japantown apartment",
    category: "apartment",
    x: 66,
    y: 32,
    district: "westbrook",
    description: "Purchasable apartment in Japantown.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Apartments", "Apartments"),
  },
  {
    id: "marker:apt-the-glen",
    name: "The Glen apartment",
    category: "apartment",
    x: 44,
    y: 68,
    district: "heywood",
    description: "Purchasable luxury apartment in The Glen.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Apartments", "Apartments"),
  },
  // Tarot graffiti (collectibles)
  {
    id: "marker:tarot-the-fool",
    name: "Tarot: The Fool",
    category: "tarot_card",
    x: 39,
    y: 24,
    district: "watson",
    description: "Tarot graffiti on the wall outside Misty's Esoterica.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Tarot_Cards", "Tarot graffiti locations"),
  },
  {
    id: "marker:tarot-the-magician",
    name: "Tarot: The Magician",
    category: "tarot_card",
    x: 53,
    y: 12,
    district: "watson",
    description: "Tarot graffiti near the Kabuki roundabout area.",
    spoilerLevel: "none",
    expansion: "base",
    meta: meta("Tarot_Cards", "Tarot graffiti locations", { verification: "unverified" }),
  },
  // Iconic weapon locations
  {
    id: "marker:skippy",
    name: "Skippy (iconic pistol)",
    category: "iconic_weapon",
    x: 40,
    y: 62,
    district: "heywood",
    description: "A talkative smart pistol found in an alley near College St. in Vista del Rey.",
    spoilerLevel: "minor",
    expansion: "base",
    meta: meta("Skippy", "Skippy"),
  },
  // Cyberpsychos & activity examples
  {
    id: "marker:cp-bloody-ritual",
    name: "Cyberpsycho: Bloody Ritual",
    category: "cyberpsycho",
    x: 50,
    y: 10,
    district: "watson",
    description: "Cyberpsycho sighting at a Northside ritual scene.",
    spoilerLevel: "none",
    expansion: "base",
    relatedJobId: "job:cyberpsycho-bloody-ritual",
    meta: meta("Cyberpsycho_Sighting:_Bloody_Ritual", "Bloody Ritual"),
  },
  // Hidden / easter eggs
  {
    id: "marker:edgerunners-basement",
    name: "Hidden: memorial scene",
    category: "easter_egg",
    x: 57,
    y: 18,
    district: "watson",
    description: "A small tribute scene added in a 2.x patch. Details left unspoiled.",
    spoilerLevel: "minor",
    expansion: "base",
    meta: meta("Easter_Eggs", "Easter eggs", { verification: "unverified" }),
  },
  {
    id: "marker:heavy-hearts",
    name: "Heavy Hearts Club",
    category: "vendor",
    x: 52,
    y: 90,
    district: "dogtown",
    description: "Dogtown's exclusive nightclub, tied to several Phantom Liberty jobs.",
    spoilerLevel: "none",
    expansion: "phantom_liberty",
    meta: meta("Heavy_Hearts", "Heavy Hearts Club", { expansion: "phantom_liberty" }),
  },
];

export const markerById = new Map(mapMarkers.map((m) => [m.id, m]));
