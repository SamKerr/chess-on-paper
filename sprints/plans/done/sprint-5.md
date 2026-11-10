# Sprint 5: Guess the evaluation

Goal: practise judging positions, on screen with engine and annotator feedback, and on
paper with evaluation quizzes.

## Scope

- In: evaluation symbols and NAGs in the parser, Stockfish in the browser, the on-screen
  guess-then-reveal panel, evaluation quizzes and import mode, drawn evaluation symbols.
- Out: lichess cloud evaluations and engine output on paper (see DECISIONS.md).

## Tickets (in order)

- [x] T15-evaluations-in-notation
- [x] T16-stockfish-in-browser
- [x] T17-guess-the-evaluation

## Done when

- Every ticket is done or explicitly moved out (with a note)
- `npm test`, `npm run lint` and `npm run typecheck` pass on the whole repo
- Docs and `AGENTS.md` updated if commands, setup or behavior changed
- `BLOCKERS.md` lists anything left open

## Outcome (fill in at close)

Shipped all three on 2026-11-07. Verified by running: typecheck, lint, 145 Vitest tests,
build (engine files included in `dist/`), 10 Playwright tests in Chromium, including real
Stockfish finding a mate in one. Screenshots caught ambiguous ⩲/± glyphs, now drawn as
SVG. Other browsers are in BLOCKERS.md under "Needs a live run".
