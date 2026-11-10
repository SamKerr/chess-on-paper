# T14-flashcards

Status: Done
Sprint: sprint-4

## Why

Print any sheet as fold-over flashcards, four per A4 page: front is the position and question, back is the answer or the idea, marks and continuation.

## Scope

- In: as above.
- Out: see sprint-4 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/cards.ts, src/components/CardSheet.tsx, layout setting`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for card contents and page counts; component test for fronts and backs; Playwright one-page PDF. (ran it)

## Notes

See DECISIONS.md (2026-11-07, fourth round).
