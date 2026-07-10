# Domain model

Single source of truth: [`types/domain.ts`](../../types/domain.ts). Two strictly separated
families — user data references canonical IDs and never mutates canonical records.

## Canonical (ships with the app, schema-validated in CI)

| Entity                                      | ID prefix              | Notes                                                                                     |
| ------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `JobDef`                                    | `job:`                 | category, district, prerequisites (job IDs), missable/PONR flags, spoiler-split summaries |
| `AchievementDef`                            | `ach:`                 | platforms, secret flag, progress model (boolean/count/percent/checklist)                  |
| `MapMarkerDef`                              | `marker:`              | normalized schematic x/y (0–100), category, district, related job                         |
| `AttributeDef` / `PerkDef` / `RelicPerkDef` | – / `perk:` / `relic:` | tier gates via `requiredAttribute`, perk prerequisites                                    |
| `CollectibleDef`                            | `col:`                 | type (iconic/vehicle/apartment/tarot/…), acquisition, related job/marker                  |
| `EndingDef`                                 | `ending:`              | spoiler-safe `codename` + shielded real name, requirements with confidence                |
| `RelationshipDef`                           | `rel:`                 | romance/companion, availability                                                           |
| `ResourceDef`                               | `res:`                 | curated link with trust level (official/community/speculative)                            |
| `progressionRules`                          | –                      | data-encoded 2.x leveling rules (with source)                                             |

Every canonical record carries `CanonicalMeta`:

```ts
{ gameVersion, expansion, lastVerified?, verification, maybeOutdated?, sources: SourceRef[] }
```

`SourceRef`: title, URL, publisher, accessedAt, notes. Schemas require ≥1 source.

## User-owned (IndexedDB, exportable)

| Entity                                    | Key                  | Notes                                                                             |
| ----------------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `Playthrough`                             | `run_<uuid>`         | lifepath, platform, difficulty, level/cred/act, status, spoiler override, tags    |
| `JobProgress`                             | `<runId>:<jobId>`    | status (7 states), pinned, notes, completedAt                                     |
| `AchievementProgress`                     | `<runId>:<achId>`    | state + count/steps per progress model                                            |
| `CollectibleProgress`                     | `<runId>:<colId>`    | 7 states (obtained/missed/equipped/…)                                             |
| `MarkerProgress`                          | `<runId>:<markerId>` | discovered + completed + notes                                                    |
| `CustomMarker`                            | `cmk_<uuid>`         | player-created map markers                                                        |
| `DecisionEntry`                           | `dec_<uuid>`         | structured decision journal with spoiler level                                    |
| `EndingProgress` / `RelationshipProgress` | composite            | tracking states                                                                   |
| `Build`                                   | `build_<uuid>`       | attributes, perk ranks, relic perks, equipment, tags; optional run link           |
| `Note` / `PinnedObjective`                | uuid                 | dashboard intel                                                                   |
| `AppSettings`                             | `"app"` singleton    | active run, spoiler mode, revealed spoilers, reduced effects, conventional labels |

## Composite-key rationale

Progress rows use deterministic `${playthroughId}:${refId}` keys so:

- upserts are idempotent (no duplicate progress rows),
- duplication of a playthrough is a pure key rewrite,
- a future sync layer can merge rows without identity ambiguity.

## Export envelope

`ExportEnvelope { app, schemaVersion, exportedAt, data: {…all 12 user tables + settings} }` —
versioned, Zod-validated on import, forward-compatible (older app rejects newer schema with a
clear message).
