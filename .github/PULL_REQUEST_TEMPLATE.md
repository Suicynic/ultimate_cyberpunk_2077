# Pull request

## What & why

<!-- Summary of the change and motivation. Link related issues. -->

## Type

- [ ] Code (feature/fix/refactor)
- [ ] Data (new records or corrections in `data/`)
- [ ] Documentation
- [ ] Design system / accessibility

## Data changes only — sourcing

<!-- Required if data/ is touched. Records without sources will not be merged. -->

- Source link(s):
- Game version verified against:
- Verification status set on records: `unverified` / `community_verified` / `source_verified`
- [ ] No text copied from any source — facts paraphrased in original wording
- [ ] IDs are stable (no renames/reuse of existing IDs)

## Checklist

- [ ] `npm run validate:data` passes
- [ ] `npm run typecheck && npm run lint && npm run format:check` pass
- [ ] `npm test` passes (new logic has tests)
- [ ] `npm run build` passes
- [ ] Spoiler-sensitive content carries an appropriate `spoilerLevel`
- [ ] No IP-guardrail violations (see `docs/legal/ip-guardrails.md`)
