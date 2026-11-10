# T02-board-and-marks

Status: Done
Sprint: sprint-1

## Why

One SVG board for screen, print and export, with coordinates, side to move, last move, arrows and circles, and pointer input for moves and drawing.

## Scope

- In: as above.
- Out: see sprint-1 Scope.

## Plan (fill in before coding)

1. Build in `src/components/Board.tsx, src/lib/geometry.ts, src/lib/pieces.ts`.

- Data/API/migration impact: none (new project).
- Risks: browser-only behaviour untested in jsdom -> Playwright covers pointer and print.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for geometry; Playwright drag/click moves and right-drag/draw-mode marks in Chromium. (ran it)

## Notes

See DECISIONS.md (2026-11-07) for stack and feature choices.
