# T13-guess-the-move

Status: Done
Sprint: sprint-4

## Why

Import a game as one-move quizzes before each of one side's moves from a chosen move; the annotator's comment goes with the answer.

## Scope

- In: as above.
- Out: see sprint-4 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/gameImport.ts, ImportGameDialog`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for side and start move; component test for the dialog and resulting quizzes. (ran it)

## Notes

See DECISIONS.md (2026-11-07, fourth round).
