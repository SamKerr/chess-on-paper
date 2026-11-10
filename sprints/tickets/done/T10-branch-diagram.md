# T10-branch-diagram

Status: Done
Sprint: sprint-3

## Why

Explore a side line: start a new diagram from the position on screen, keeping the moves that led there, placed after the current one.

## Scope

- In: as above.
- Out: see sprint-3 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/gameImport.ts (lineUpTo), App branch, DiagramEditor button`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright PDF page count and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit test for lineUpTo; component test for placement, notation and selection; used in the quiz e2e test. (ran it)

## Notes

See DECISIONS.md (2026-11-07, third feature round).
