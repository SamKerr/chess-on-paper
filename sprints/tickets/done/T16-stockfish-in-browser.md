# T16-stockfish-in-browser

Status: Done
Sprint: sprint-5

## Why

Evaluate any legal position locally with Stockfish 19 lite in a Web Worker, loaded on first use; finished games are settled without the engine.

## Scope

- In: as above.
- Out: see sprint-5 Scope.

## Plan (fill in before coding)

1. Build in `public/engine/, src/lib/engine.ts`.

- Data/API/migration impact: none; nothing is saved. No network calls.
- Risks: engine loading in other browsers -> BLOCKERS.md "Needs a live run".

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Unit tests with a fake UCI worker; Playwright with the real engine (mate in one, quiet position). (ran it)

## Notes

See DECISIONS.md (2026-11-07, guess the evaluation).
