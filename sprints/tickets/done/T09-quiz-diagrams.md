# T09-quiz-diagrams

Status: Done
Sprint: sprint-3

## Why

Test yourself on paper: a quiz diagram prints without marks or what comes next, and the continuation (and marks, on a small board) prints on answer pages at the end, which can be torn off.

## Scope

- In: as above.
- Out: see sprint-3 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/sheet.ts (quiz, pageCount), src/lib/format.ts (movesAfter), src/components/PrintSheet.tsx, DiagramEditor quiz toggle`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright PDF page count and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for movesAfter and pageCount; component tests for print preview and the no-answer hint; Playwright PDF page count. (ran it)

## Notes

See DECISIONS.md (2026-11-07, third feature round).
