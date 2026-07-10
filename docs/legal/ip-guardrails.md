# Intellectual-property guardrails

This is a public fan project. The following rules keep it publishable. PRs violating them are
rejected regardless of usefulness.

## Never commit

- Extracted or datamined game files of any kind (models, audio, textures, scripts, strings)
- Official artwork, key art, character renders, or screenshots used as UI assets
- The game's proprietary fonts (or lookalike rips); use licensed/open fonts only
- Official soundtrack audio
- Map tiles or imagery derived from the in-game map or official map products
- Verbatim wiki/guide text beyond short attributed quotes (we paraphrase instead — see
  DATA_SOURCES.md)
- Any portion of paid guide content
- Trademarked logos presented as this project's branding

## Always

- Use original visual assets (the "NC/OS" design system, schematic map, project wordmark are
  original works)
- Attribute facts to sources with links
- Keep the unofficial-status disclaimer visible in the app footer, README, and DISCLAIMER.md
- Honor removal/attribution requests via the process in DISCLAIMER.md

## Licensing split

- **Source code:** MIT (`LICENSE`).
- **Curated data (`data/`):** MIT for the compilation/expression we authored; underlying game
  facts belong to their rights holders and cited sources retain their own terms. Contributors
  license their contributions under the repo license (standard inbound=outbound).
- If community-contributed datasets grow substantially, consider CC BY-SA for `data/` as a
  separate license — tracked as an open question for Phase 2.

## Gray areas — ask first

- Fan-made maps: even community maps may embed traced/derived official artwork. Require
  explicit permission + provenance before integrating any base layer.
- Datamined values (exact perk percentages): prefer values verified in-game or via official
  patch notes; when community sources publish datamined numbers, cite them and mark
  `community_verified` at best, and respect any takedown signals.
- Save-file parsing (Phase 4 research): must be evaluated against EULA/ToS before any
  implementation ships.
