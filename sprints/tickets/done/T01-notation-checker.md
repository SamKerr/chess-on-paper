# T01-notation-checker

Status: Done
Sprint: sprint-1

## Why

Parse moves and FENs as people write them; flag the first bad move with its number, text range and likely fixes.

## Scope

- In: as above.
- Out: see sprint-1 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/notation.ts, src/lib/notation.test.ts`.

- Data/API/migration impact: none (new project).
- Risks: browser-only behaviour untested in jsdom -> Playwright covers pointer and print.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests: handwriting conventions, FEN with/without fields, kingless positions, illegal, ambiguous and misnumbered moves, appendMove. (ran it)

## Notes

See DECISIONS.md (2026-11-07) for stack and feature choices.
