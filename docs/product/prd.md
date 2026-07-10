# Product Requirements — Ultimate Cyberpunk 2077 Companion

## Vision

A purpose-built "operating system for a Night City mercenary": one cohesive, local-first web
app where a player plans, tracks, and documents an entire playthrough — instead of juggling
wikis, calculators, maps, guides, and spreadsheets.

The app is a **companion**, not a replacement for the game or community reference sites. It
owns the player's _personal_ state (progress, decisions, builds, notes) and links out for deep
reference content.

## Users & core journeys

1. **The fresh runner** — starts a first playthrough, wants zero spoilers, needs "what next"
   guidance and missable warnings without learning why they matter.
2. **The completionist** — tracks every gig, cyberpsycho, tarot card, and achievement across
   platforms; needs percentages, filters, and bulk operations.
3. **The theorycrafter** — plans 2.x builds against real constraints, shares them as URLs,
   keeps variants per playthrough.
4. **The archivist** — replays with different lifepaths/romances/endings, journals decisions
   and consequences, compares runs.

## Product principles (non-negotiable)

- **Local-first**: no account required; IndexedDB persistence; JSON export/import; sync-ready
  data layer (IDs stable, rows carry `updatedAt`).
- **Data transparency**: every canonical fact carries sources, game version, verification
  status. Paraphrase only, never mirror.
- **Spoiler control**: global modes (`hide_all` / `hide_major` / `show_all`), per-item
  reveal-on-demand (session or persisted), shielded search results, codenames for endings.
- **Version awareness**: records labeled with the verified game version; outdated mechanics
  flagged, never silently mixed in.
- **Accessibility**: WCAG-conscious contrast, keyboard-first, visible focus, semantic HTML,
  reduced-motion/effects modes, 44px touch targets, no color-only signaling.

## Functional scope (MVP — shipped)

| #   | Requirement                                                                        | Status |
| --- | ---------------------------------------------------------------------------------- | ------ |
| 1   | Responsive app shell with original visual system                                   | ✅     |
| 2   | Local-first playthrough creation/duplication/archive/delete                        | ✅     |
| 3   | Dashboard with weighted progress summaries & suggested actions                     | ✅     |
| 4   | Job tracker with starter dataset (40 jobs), prerequisites, missables, PONR flags   | ✅     |
| 5   | Achievement tracker (boolean/count/percent/checklist models, secrets shielded)     | ✅     |
| 6   | Build planner with 2.x constraint validation, share URLs, JSON export              | ✅     |
| 7   | Interactive schematic map with filters, per-run states, custom markers, deep links | ✅     |
| 8   | Global search / command palette (Ctrl-K) incl. actions                             | ✅     |
| 9   | Spoiler controls (global + per-item + per-playthrough override)                    | ✅     |
| 10  | JSON import/export with schema validation & rejection of invalid payloads          | ✅     |
| 11  | Source attribution system with verification statuses                               | ✅     |
| 12  | Accessibility settings (reduced effects, conventional labels)                      | ✅     |
| 13  | Dark cyberpunk visual system ("NC/OS")                                             | ✅     |
| 14  | Automated tests for progress calculations & critical flows                         | ✅     |
| 15  | Public docs & contribution standards                                               | ✅     |

Also shipped beyond the minimum: decision journal, relationship tracking, endings tracker with
confidence-labeled requirements, collections tracker, curated resource library with automated
link checking.

## Explicit non-goals (initial release)

User accounts, social features, comments, multiplayer, site scraping, unverified AI-generated
facts, save-file parsing, mod installation, exhaustive item databases, full lore archive,
native apps, monetization, ads.

## Success criteria

- All quality gates green in CI (types, lint, unit, e2e, data validation, build).
- A new user can create a run and mark a job complete in under a minute.
- A spoiler-averse user can browse every section without encountering an unshielded
  major/endgame fact.
- An exported backup restores byte-equivalent state on a clean browser profile.

## Risk register

| Risk                                                           | Mitigation                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **IP exposure** (assets, copied text, map tiles)               | Original schematic map; paraphrase-only rule; CI-enforced source fields; DISCLAIMER + removal process        |
| **Data accuracy drift across patches**                         | Version labels, verification statuses, `version_outdated` state, link checker, correction templates          |
| **Dataset scale** (thousands of records eventually)            | Prove architecture with small dataset first; stable IDs; schema validation; static search index script ready |
| **Browser storage loss**                                       | Prominent JSON export; import validation; documented backup flow                                             |
| **Maintenance burden**                                         | Community contribution model with review statuses; scheduled link checks; strict typing                      |
| **Fabrication temptation** (perk numbers, hidden requirements) | Qualitative summaries; `unverified`/`disputed` statuses used honestly; tests assert schema compliance        |
