# Contributing

Thanks for helping build the Night City Companion. This project accepts code, curated data,
documentation, and design contributions.

## Ground rules

- Be excellent to each other — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- **Game facts require sources.** Read [DATA_SOURCES.md](DATA_SOURCES.md) before touching
  anything in `data/`.
- **Respect IP guardrails.** No game files, copied guide/wiki text, proprietary fonts, official
  artwork, or unlicensed map tiles. See [DISCLAIMER.md](DISCLAIMER.md) and
  [`docs/legal/ip-guardrails.md`](docs/legal/ip-guardrails.md).
- Spoilers are a product feature: anything story-sensitive must carry an appropriate
  `spoilerLevel` and stay behind the shield.

## Development setup

```bash
npm install
npm run dev
```

Before opening a PR, make sure the full gate passes locally:

```bash
npm run validate:data && npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

Playwright flows (optional locally, run in CI):

```bash
npx playwright install chromium   # once
npm run test:e2e
```

## What to contribute

| Contribution            | How                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Data correction**     | _Data correction_ issue template or a PR editing `data/` with sources          |
| **New dataset records** | PR following DATA_SOURCES.md; keep IDs stable and namespaced                   |
| **New resource link**   | _Resource submission_ issue template                                           |
| **Bug**                 | _Bug report_ template with reproduction steps                                  |
| **Feature**             | _Feature request_ template — check the roadmap in `docs/product/` first        |
| **Code**                | PR with tests for new logic; keep the design system's accessibility guarantees |

## Code guidelines

- TypeScript strict mode; no `any` unless justified in a comment.
- Pure logic (progress math, spoiler rules, validation) lives in `lib/` and gets unit tests.
- All user-data mutations go through `lib/database/repo.ts` — never write to Dexie from
  components directly.
- Canonical data is read-only at runtime; user progress never mutates canonical records.
- UI: 44px minimum touch targets, visible focus, labels for every input, no color-only
  signaling, respect `reducedEffects`.
- Run `npm run format` before committing (Prettier is the formatting authority).

## Review status for data records

Every canonical record carries `meta.verification`
(`unverified` / `community_verified` / `source_verified` / `version_outdated` / `disputed` /
`deprecated`). Reviewers may downgrade a record's status rather than reject a PR — honest
uncertainty is welcome, silent guessing is not.

## Reporting outdated game data

Open a _Data correction_ issue with: the record ID, the game version you observed, what
changed, and a source (patch notes preferred).

## Reporting copyright concerns

See the removal-request process in [DISCLAIMER.md](DISCLAIMER.md).
