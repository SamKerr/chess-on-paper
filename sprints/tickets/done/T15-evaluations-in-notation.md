# T15-evaluations-in-notation

Status: Done
Sprint: sprint-5

## Why

Read the annotator's evaluations (glyphs, ASCII forms, NAGs $10-$21) and lichess [%eval] scores; ignore [%clk] and other commands in comments instead of treating them as annotation.

## Scope

- In: as above.
- Out: see sprint-5 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/evaluation.ts, src/lib/notation.ts`.

- Data/API/migration impact: none; nothing is saved. No network calls.
- Risks: engine loading in other browsers -> BLOCKERS.md "Needs a live run".

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for written forms (including promotions and checks), NAGs, scores, closeness, and lichess-style comments. (ran it)

## Notes

See DECISIONS.md (2026-11-07, guess the evaluation).
