# Data sourcing & citation rules

This project treats game data the way a research project treats claims: **every externally
sourced fact needs provenance**, and the confidence in a record is explicit.

## The rules

1. **No copied text.** Do not paste wiki articles, guide passages, achievement flavor text
   verbatim, or any paid-guide content. Summarize the fact in your own words.
2. **No copied assets.** No screenshots-as-data, extracted game files, datamined content that
   violates applicable terms, or map imagery you don't have rights to.
3. **Every canonical record cites at least one source** (`meta.sources[]`), with title, URL,
   and access date. The Zod schema enforces the minimum.
4. **Every record carries a game version** (`meta.gameVersion`) — the version it was last
   verified against. Cyberpunk changed substantially at 2.0; unlabeled pre-2.0 mechanics are
   not acceptable.
5. **No invented mechanics.** Perk effects, thresholds, and requirements must trace to a
   source. When exact values are uncertain, describe qualitatively and mark the record
   `unverified` — an honest "needs verification" beats a confident fabrication.
6. **No single-correct-choice framing.** Quest records describe outcomes; they never declare
   one branch "correct".
7. **Community findings are labeled.** Ending requirements use
   `confirmed` / `probable` / `disputed` confidence levels. Speculation is never presented as
   fact.

## Verification statuses

| Status               | Meaning                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `unverified`         | Entered from memory or an unchecked source; needs review                      |
| `community_verified` | Matches a maintained community source (wiki, PowerPyx, etc.)                  |
| `source_verified`    | Verified against an official source or directly in-game on the stated version |
| `version_outdated`   | Was correct for an older game version; needs re-verification                  |
| `disputed`           | Community sources disagree                                                    |
| `deprecated`         | Removed from the game or superseded; retained for history                     |

CI runs `npm run validate:data` (schema + referential integrity). A scheduled workflow runs
`npm run check:links` to detect dead source URLs — it fetches headers only and never imports
content.

## Preferred sources

- **Official:** cyberpunk.net news/patch notes, CD Projekt Red support.
- **Community (maintained):** Cyberpunk Wiki (Fandom), PowerPyx trophy guide, Nukes & Dragons
  planner, PCGamingWiki.
- **Avoid:** unattributed reposts, single Reddit comments (use as `disputed` leads only),
  paid guide content in any form.

## Adding or correcting data

1. Edit the relevant file in `data/` (records are TypeScript objects validated by
   `lib/validation/schemas.ts`).
2. Use a stable, namespaced kebab-case ID (`job:the-heist`). **Never reuse or rename an
   existing ID** — user progress is keyed on it.
3. Fill in `meta` honestly: sources, game version, verification status.
4. Run `npm run validate:data && npm test`.
5. Open a PR using the _data correction_ template, quoting your source.

Records without sources will not be merged.
