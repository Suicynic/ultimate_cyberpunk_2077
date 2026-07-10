# Ultimate Cyberpunk 2077 — Night City Companion

**An unofficial, local-first companion app for planning, tracking, and documenting your
Cyberpunk 2077 and Phantom Liberty playthroughs.**

> ⚠️ Unofficial fan project. Not affiliated with, endorsed by, or sponsored by CD Projekt Red.
> Cyberpunk 2077®, Phantom Liberty, and related marks are the property of their respective
> owners. See [DISCLAIMER.md](DISCLAIMER.md).

Most Cyberpunk 2077 resources are scattered across wikis, build calculators, interactive maps,
achievement guides, and spreadsheets. This project consolidates the _player's own workflow_ —
progress, decisions, builds, discoveries — into one purpose-built interface, and links out to
the community resources that do the deep reference work.

## What it does

| Area                | What you get                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Command Center**  | Active-run dashboard: completion estimates, pinned objectives, suggested next actions, notes                   |
| **Active Runs**     | Multiple playthroughs — lifepath, platform, difficulty, status, duplicate/archive/delete                       |
| **Job Database**    | Source-backed job tracker with prerequisites, missable & point-of-no-return flags, per-job notes, bulk updates |
| **District Scan**   | Filterable schematic map of Night City & Dogtown with per-run discovery/completion states and custom markers   |
| **Build Matrix**    | 2.x attribute/perk/relic planner with constraint validation, shareable build URLs, JSON export                 |
| **Accolades**       | Achievement tracker with count/checklist progress models and secret-achievement shielding                      |
| **Loadout & Cache** | Opt-in collection tracking: iconic weapons, vehicles, apartments, tarot                                        |
| **Endgame Intel**   | Spoiler-shielded endings & relationships plus a decision/consequence journal                                   |
| **Archive**         | Curated, link-checked directory of official and community resources                                            |
| **Spoiler Shield**  | Global modes, per-item reveal-on-demand, persisted reveals — spoilers are a first-class concern                |

Everything is stored **locally in your browser** (IndexedDB). No account, no server, no
telemetry. Back up or move your data with one-click JSON export/import.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other useful commands:

```bash
npm run build          # production build
npm test               # unit + component tests (Vitest)
npm run test:e2e       # critical flows (Playwright)
npm run typecheck      # TypeScript strict mode
npm run lint           # ESLint
npm run validate:data  # canonical dataset schema + referential integrity
npm run check:links    # external link health (report only)
```

## Design principles

- **Local-first.** IndexedDB via Dexie; JSON export/import; the data layer is structured so
  optional cloud sync can be added later without a rewrite.
- **Provenance everywhere.** Every canonical game fact carries sources, a game version, and a
  verification status (`unverified` → `community_verified` → `source_verified`, plus
  `disputed`/`version_outdated`/`deprecated`). Facts are paraphrased, never copied.
- **Spoiler shield.** Nothing meaningful about endings, character fates, or secret achievements
  is visible until you ask for it.
- **Version-aware.** Records are labeled with the 2.x game version they were verified against;
  pre-2.0 mechanics are never mixed into current recommendations unlabeled.
- **Accessible.** Semantic HTML, full keyboard navigation, visible focus states, 44px touch
  targets, reduced-effects mode, and no information carried by color alone.
- **Small, accurate data over big, scraped data.** The MVP ships a deliberately small
  starter dataset (~130 records) that exercises every feature. Growing it is a community
  effort with sourcing rules — see [DATA_SOURCES.md](DATA_SOURCES.md).

## Tech stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Dexie (IndexedDB) · Zustand ·
Zod · Leaflet · Fuse.js · cmdk · Radix primitives · Vitest + Testing Library · Playwright ·
GitHub Actions · Vercel-ready.

Architecture docs live in [`docs/architecture/`](docs/architecture/), the product requirements
in [`docs/product/`](docs/product/).

## Contributing

Contributions are welcome — especially **sourced data corrections**. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and [DATA_SOURCES.md](DATA_SOURCES.md). Factual game data is
only accepted with a source link and is labeled with a review status.

Found outdated data? Open a _Data correction_ issue. Copyright concern? See
[DISCLAIMER.md](DISCLAIMER.md) for the removal-request process.

## License

- **Code:** [MIT](LICENSE).
- **Curated data files** (`data/`): MIT, with the caveat that they describe facts about a game
  owned by CD Projekt Red and paraphrase community documentation — attribution requirements of
  the cited sources apply. See [DATA_SOURCES.md](DATA_SOURCES.md).
