# Technical architecture

## Stack

- **Next.js 15 (App Router)** — one route per product area; everything prerenders statically
  and hydrates into a client app (deployable as a static-ish site on Vercel or any host).
- **TypeScript strict** everywhere, `noUncheckedIndexedAccess` on.
- **Tailwind CSS 4** with design tokens declared in `@theme` (`app/globals.css`).
- **Dexie (IndexedDB)** for user-owned data; **dexie-react-hooks** `useLiveQuery` makes every
  view reactive to writes with no extra state management.
- **Zustand** only for ephemeral UI state (palette open, session spoiler peeks, mobile nav).
- **Zod** validates canonical data (dev/CI) and import payloads (runtime).
- **Leaflet + react-leaflet** with `CRS.Simple` for the schematic map.
- **Fuse.js + cmdk** for the command palette / global search.
- **Radix Dialog** for accessible modals; everything else is hand-rolled semantic HTML.

## Layering

```
app/(routes)          – client pages, thin: query + compose components
components/ui         – design-system primitives (Panel, Button, Badge, Dialog, …)
components/shared     – shell, palette, spoiler shield, source list
components/map        – Leaflet layer (dynamically imported, no SSR)
lib/database          – Dexie schema (db.ts) + repository layer (repo.ts)
lib/progress          – pure progress math            ← unit tested
lib/spoilers          – pure shield rules             ← unit tested
lib/build-planner     – pure constraint validation    ← unit tested
lib/import-export     – envelope build/parse/import   ← unit tested
lib/search            – search doc builder + Fuse index
lib/validation        – Zod schemas (canonical + user + envelope)
data/*                – canonical datasets (TS records with meta.sources)
types/domain.ts       – single source of truth for the domain model
scripts/*             – validate-data, check-links, generate-search-index (tsx)
```

**Rules enforced by convention and review:**

1. Components never write to Dexie directly — all mutations go through `lib/database/repo.ts`,
   so persistence can later be swapped/synced without touching UI.
2. Canonical data is immutable at runtime. User progress references canonical IDs; it never
   mutates canonical records.
3. Pure logic modules have no I/O and are fully unit-tested.

## Persistence & sync-readiness

Single Dexie database `ultimate-cyberpunk-2077`, schema v1, 13 tables (see `db.ts`). Design
choices that keep cloud sync cheap later:

- Stable IDs: user rows use `crypto.randomUUID()`-based IDs; per-playthrough progress rows use
  deterministic composite keys `${playthroughId}:${refId}` (idempotent upserts).
- Every row carries `updatedAt` — enough for last-write-wins merge.
- Export envelope (`schemaVersion`) is the wire format a future sync server would speak.
- Import validates the entire envelope with Zod **before** any write, inside a transaction.

## Spoiler shield

`isShielded(level, mode, revealedKeys, revealKey)` is a pure function. UI passes through
`useSpoilerGuard()` which layers: per-playthrough mode override → global mode → persisted
reveals (settings) → session peeks (Zustand). Shielded content is **replaced, not blurred** —
nothing leaks to screen readers, the DOM, or search. Endings are indexed by codename only.

## Search

Canonical search docs are built once per session from datasets; user docs (notes, builds,
playthroughs) are appended live from Dexie. Shielded records surface with spoiler-safe titles
only. `scripts/generate-search-index` can pre-build a static index when the dataset grows.

## Testing strategy

- **Unit (Vitest, jsdom, fake-indexeddb):** progress math, spoiler rules, build validation,
  import/export round-trip + rejection, repository lifecycle, dataset schema compliance.
- **Component (Testing Library):** SpoilerShield behavior against real settings.
- **E2E (Playwright, desktop + mobile projects):** create run → dashboard, job status →
  progress, spoiler reveal, settings persistence across reload, JSON export download, mobile
  nav. `PLAYWRIGHT_CHROMIUM_PATH` supports sandboxes with pinned browsers.

## CI

`.github/workflows/ci.yml`: data validation → typecheck → lint → format check → unit tests →
build, plus a separate Playwright job. `link-check.yml` runs weekly and reports (never fails
hard, never imports content).
