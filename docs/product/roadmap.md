# Phased implementation plan & roadmap

## Phase 1 — MVP (this release)

Durable system + small accurate dataset + premium UX. See `prd.md` for the shipped checklist.

Order of implementation used (and recommended for similar efforts):

1. MVP boundary definition & risk audit
2. Domain model (`types/domain.ts`) — canonical vs user-owned split
3. Source-attribution rules (`DATA_SOURCES.md`, `SourceRef`/`CanonicalMeta`, Zod enforcement)
4. Local persistence architecture (Dexie schema, repository layer)
5. Route map (App Router, one section per area)
6. Design system ("NC/OS" tokens, primitives, reduced-effects support)
7. Application shell (nav, top bar, command palette, footer disclaimer)
8. Playthrough management
9. Job tracking
10. Progress calculations (pure, tested)
11. Achievement tracking
12. Build planner foundation
13. Map foundation (schematic layer, swappable for licensed tiles)
14. Search & spoiler controls
15. Import/export
16. Tests (unit → component → e2e)
17. Public documentation
18. Accessibility & mobile validation
19. Quality gates in CI
20. Limitations report (below)

## Phase 2 — Content & depth

- Full quest dataset (community-sourced, PR-by-PR with sources)
- Expanded achievement data incl. verified Phantom Liberty set
- Detailed map markers; marker clustering once counts warrant it
- Quest dependency visualization (graph view)
- Multiple map layers; licensed/community-permitted tile support
- Collection trackers for remaining categories (quickhacks, crafting specs, shards)
- Installable PWA + offline reference data
- Advanced search filters; pre-built static search index

## Phase 3 — Optional cloud

- Optional authentication + cloud synchronization (last-write-wins on `updatedAt`, then CRDT
  if concurrent editing matters)
- Public read-only build profiles & playthrough pages
- Community build templates; collaborative data verification workflow
- Data correction moderation dashboard; progress analytics

## Phase 4 — Research tracks

- Save-file import (**experimental only** until legality, reliability, platform limits, and
  maintenance burden are understood)
- Mod integration research
- Community API; internationalization; additional accessibility modes
- Companion mobile packaging if demand justifies it

## Known limitations (v0.1)

- Starter dataset only (~130 records) — deliberately small; not a complete database.
- Two records are honestly labeled `unverified` placeholders (PL achievement names) and one
  NCPD aggregate entry stands in for per-district hustle tracking.
- Schematic map positions are approximate by design; no real coordinate system yet.
- No marker clustering (unnecessary at current marker counts).
- Perk dataset covers a representative slice per attribute, not full trees; relic tree is
  partial. Effects are qualitative on purpose.
- Achievement platform differences (e.g., GOG achievement parity) not yet modeled per-record.
- Build "level milestones" are notes-based rather than structured.
- IndexedDB is per-browser-profile; users must export to move devices (by design until
  Phase 3).
