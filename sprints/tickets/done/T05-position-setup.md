# T05-position-setup

Status: Done
Sprint: sprint-2

## Why

Copy a position from a book without knowing its FEN: place pieces, drag them, set side to move, presets, undo. Castling rights are inferred; pawns can't go on the back ranks.

## Scope

- In: as above.
- Out: see sprint-2 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/setup.ts, src/components/SetupPanel.tsx, Board setup mode`.

- Data/API/migration impact: new sheet settings default in `sheetFromJson`, so old sheets load.
- Risks: layout regressions -> Playwright screenshots reviewed.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for placement, castling inference, parser round-trip; component test for presets, side to move and undo; Playwright clicks and drags then plays a move. (ran it)

## Notes

See DECISIONS.md (2026-11-07, second feature round).
