# T17-guess-the-evaluation

Status: Done
Sprint: sprint-5

## Why

Guess first, then reveal engine, annotator and stored evaluations with closeness feedback; evaluation quizzes with a printed scale; import mode for evaluated moves; drawn symbols.

## Scope

- In: as above.
- Out: see sprint-5 Scope.

## Plan (fill in before coding)

1. Build in `src/components/EvalGuess.tsx, VerdictMark.tsx, quiz/print/card/import changes`.

- Data/API/migration impact: none; nothing is saved. No network calls.
- Risks: engine loading in other browsers -> BLOCKERS.md "Needs a live run".

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Component tests with a fake engine; Playwright screenshots of panel and printed scale. (ran it)

## Notes

See DECISIONS.md (2026-11-07, guess the evaluation).
