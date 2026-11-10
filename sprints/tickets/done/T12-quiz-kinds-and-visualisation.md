# T12-quiz-kinds-and-visualisation

Status: Done
Sprint: sprint-4

## Why

Quizzes gain a kind: 'what comes next' (optionally limited to N half-moves) or 'play it in your head' (the next N half-moves print as text; the answer is the board after them).

## Scope

- In: as above.
- Out: see sprint-4 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/quiz.ts, src/lib/sheet.ts, DiagramEditor, PrintSheet`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for quizText; component test for the visualise flow and its print. (ran it)

## Notes

See DECISIONS.md (2026-11-07, fourth round).
