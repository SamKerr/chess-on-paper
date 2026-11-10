# T06-pgn-import

Status: Done
Sprint: sprint-2

## Why

Paste a game, pick positions (every N moves, listed moves, annotated moves) and get captioned diagrams. Parser reads [Tags], [FEN], skips nested variations, records comments and glyphs.

## Scope

- In: as above.
- Out: see sprint-2 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/notation.ts, src/lib/gameImport.ts, src/components/ImportGameDialog.tsx`.

- Data/API/migration impact: new sheet settings default in `sheetFromJson`, so old sheets load.
- Risks: layout regressions -> Playwright screenshots reviewed.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests on a full annotated PGN, including character offsets after headers and variations; component tests for import and for an unreadable game. (ran it)

## Notes

See DECISIONS.md (2026-11-07, second feature round).
