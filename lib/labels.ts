import type {
  CharacterCategory,
  CharacterImportance,
  CharacterRelationshipType,
  CharacterStatus,
  CollectibleState,
  CollectibleType,
  District,
  FactionCategory,
  GameScope,
  JobCategory,
  JobStatus,
  Lifepath,
  MarkerCategory,
  Platform,
  PlaythroughStatus,
  VerificationStatus,
} from "@/types/domain";

/**
 * Display labels. Each nav section has a thematic label and a conventional
 * label; the settings toggle "conventionalLabels" switches between them.
 */

export const NAV_SECTIONS = [
  { href: "/dashboard", thematic: "Command Center", conventional: "Dashboard" },
  { href: "/playthroughs", thematic: "Active Runs", conventional: "Playthroughs" },
  { href: "/jobs", thematic: "Job Database", conventional: "Quest Tracker" },
  { href: "/map", thematic: "District Scan", conventional: "Map" },
  { href: "/builds", thematic: "Build Matrix", conventional: "Build Planner" },
  { href: "/achievements", thematic: "Accolades", conventional: "Achievements" },
  { href: "/collections", thematic: "Loadout & Cache", conventional: "Collections" },
  { href: "/characters", thematic: "Personnel Archive", conventional: "Characters" },
  { href: "/endings", thematic: "Endgame Intel", conventional: "Endings" },
  { href: "/resources", thematic: "Archive", conventional: "Resources" },
  { href: "/settings", thematic: "System Config", conventional: "Settings" },
] as const;

export const JOB_CATEGORY_LABEL: Record<JobCategory, string> = {
  main: "Main job",
  side: "Side job",
  gig: "Gig",
  ncpd: "NCPD hustle",
  cyberpsycho: "Cyberpsycho",
  romance: "Romance",
  companion: "Companion",
  ending: "Ending path",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  locked: "Locked",
  available: "Available",
  active: "Active",
  completed: "Completed",
  failed: "Failed",
  missed: "Missed",
  skipped: "Skipped",
};

export const DISTRICT_LABEL: Record<District, string> = {
  watson: "Watson",
  westbrook: "Westbrook",
  city_center: "City Center",
  heywood: "Heywood",
  santo_domingo: "Santo Domingo",
  pacifica: "Pacifica",
  badlands: "Badlands",
  dogtown: "Dogtown",
};

export const LIFEPATH_LABEL: Record<Lifepath, string> = {
  nomad: "Nomad",
  streetkid: "Streetkid",
  corpo: "Corpo",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  pc_steam: "PC (Steam)",
  pc_gog: "PC (GOG)",
  pc_epic: "PC (Epic)",
  playstation: "PlayStation",
  xbox: "Xbox",
};

export const PLAYTHROUGH_STATUS_LABEL: Record<PlaythroughStatus, string> = {
  planned: "Planned",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  abandoned: "Abandoned",
  new_game_plus: "NG+ / Modded",
};

export const MARKER_CATEGORY_LABEL: Record<MarkerCategory, string> = {
  fast_travel: "Fast travel",
  main_job: "Main job",
  side_job: "Side job",
  gig: "Gig",
  ncpd: "NCPD",
  cyberpsycho: "Cyberpsycho",
  tarot_card: "Tarot",
  relic_terminal: "Relic terminal",
  iconic_weapon: "Iconic weapon",
  vehicle: "Vehicle",
  apartment: "Apartment",
  vendor: "Vendor",
  ripperdoc: "Ripperdoc",
  hidden: "Hidden",
  easter_egg: "Easter egg",
  custom: "Custom",
};

export const COLLECTIBLE_TYPE_LABEL: Record<CollectibleType, string> = {
  iconic_weapon: "Iconic weapons",
  cyberware: "Cyberware",
  quickhack: "Quickhacks",
  vehicle: "Vehicles",
  apartment: "Apartments",
  tarot_card: "Tarot graffiti",
  relic_terminal: "Relic terminals",
  quest_reward: "Quest rewards",
};

export const COLLECTIBLE_STATE_LABEL: Record<CollectibleState, string> = {
  not_obtained: "Not obtained",
  obtained: "Obtained",
  missed: "Missed",
  upgraded: "Upgraded",
  stored: "Stored",
  equipped: "Equipped",
  sold: "Sold / dismantled",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  community_verified: "Community verified",
  source_verified: "Source verified",
  version_outdated: "Version outdated",
  disputed: "Disputed",
  deprecated: "Deprecated",
};

export const GAME_SCOPE_LABEL: Record<GameScope, string> = {
  base_game: "Base game",
  phantom_liberty: "Phantom Liberty",
  both: "Base + Phantom Liberty",
};

/** Compact game-scope label for tight card badges. */
export const GAME_SCOPE_SHORT: Record<GameScope, string> = {
  base_game: "Base",
  phantom_liberty: "PL",
  both: "Base · PL",
};

export const CHARACTER_IMPORTANCE_LABEL: Record<CharacterImportance, string> = {
  primary: "Primary",
  major: "Major",
  supporting: "Supporting",
};

export const CHARACTER_CATEGORY_LABEL: Record<CharacterCategory, string> = {
  core: "Core crew",
  fixer: "Fixers",
  netrunner: "Netrunners",
  corporate: "Corporate",
  nomad: "Nomads",
  gang: "Gangs",
  night_city: "Night City figures",
  phantom_liberty: "Phantom Liberty",
};

export const CHARACTER_STATUS_LABEL: Record<CharacterStatus, string> = {
  active: "Active",
  unknown: "Unknown",
  legend: "Legend",
};

export const CHARACTER_RELATIONSHIP_TYPE_LABEL: Record<CharacterRelationshipType, string> = {
  romance: "Romanceable",
  companion: "Companion",
  quest: "Quest character",
  fixer: "Fixer",
};

export const FACTION_CATEGORY_LABEL: Record<FactionCategory, string> = {
  corporation: "Corporation",
  gang: "Gang",
  nomad: "Nomad",
  government: "Government",
  organization: "Organization",
};
