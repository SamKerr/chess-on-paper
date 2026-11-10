# Sprint 2: Getting positions in, and context on paper

Goal: positions from books and from whole games get onto note sheets easily, and printed
diagrams carry the moves that led to them.

## Scope

- In: hand set-up of positions, PGN import, moves and figurines in print.
- Out: quiz sheets (deferred), share links (rejected); see DECISIONS.md.

## Tickets (in order)

- [x] T05-position-setup
- [x] T06-pgn-import
- [x] T07-moves-in-print

## Done when

- Every ticket is done or explicitly moved out (with a note)
- `npm test`, `npm run lint` and `npm run typecheck` pass on the whole repo
- Docs and `AGENTS.md` updated if commands, setup or behavior changed
- `BLOCKERS.md` lists anything left open

## Outcome (fill in at close)

Shipped all three on 2026-11-07. Verified by running: typecheck, lint, 79 Vitest tests,
build, and 6 Playwright tests in Chromium, including setting up a position by clicking and
dragging and then playing a move from it. Screenshots reviewed; they caught three layout
bugs (setup palette pushing the board off-screen, squashed dialog inputs, board-sizing CSS
hitting figurines), all fixed.
