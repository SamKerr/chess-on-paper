# T11-positions-from-links

Status: Done
Sprint: sprint-3

## Why

Paste a lichess analysis or editor link, or any URL with ?fen=, and get its position; other links get a clear message.

## Scope

- In: as above.
- Out: see sprint-3 Scope.

## Plan (fill in before coding)

1. Build in `src/lib/notation.ts (fenFromUrl)`.

- Data/API/migration impact: none; nothing is saved.
- Risks: print layout -> Playwright PDF page count and screenshots.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests for five link forms, moves after a link, and a game link; component test for a pasted link. (ran it)

## Notes

See DECISIONS.md (2026-11-07, third feature round).
