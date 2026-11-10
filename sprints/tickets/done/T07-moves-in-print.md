# T07-moves-in-print

Status: Done
Sprint: sprint-2

## Why

Print the moves leading to each diagram (latest 12 moves for long lines), optionally in figurine notation drawn with the piece artwork.

## Scope

- In: as above.
- Out: see sprint-2 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/format.ts, src/components/MoveText.tsx, PrintSheet, settings`.

- Data/API/migration impact: new sheet settings default in `sheetFromJson`, so old sheets load.
- Risks: layout regressions -> Playwright screenshots reviewed.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for movesUpTo; component test for toggles and figurine rendering; print preview screenshot reviewed. (ran it)

## Notes

See DECISIONS.md (2026-11-07, second feature round).
