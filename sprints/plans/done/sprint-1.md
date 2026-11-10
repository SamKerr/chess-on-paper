# Sprint 1: Chess note sheets

Goal: a working web app that turns hand-written notation into print-ready diagrams and A4
note sheets.

## Scope

- In: notation parsing and checking, board rendering with marks, editor UI, print sheets,
  export, persistence, tests.
- Out: OCR of handwritten notes (rejected, see DECISIONS.md), variations, accounts/sync.

## Tickets (in order)

- [x] T01-notation-checker
- [x] T02-board-and-marks (after T01)
- [x] T03-print-sheets (after T02)
- [x] T04-editor-ui-and-export (after T02)

## Done when

- Every ticket is done or explicitly moved out (with a note)
- `npm test`, `npm run lint` and `npm run typecheck` pass on the whole repo
- Docs and `AGENTS.md` updated if commands, setup or behavior changed
- `BLOCKERS.md` lists anything left open

## Outcome (fill in at close)

Shipped all four tickets on 2026-11-07. Verified by running: typecheck, lint, 54 Vitest
tests, build, and 4 Playwright tests in Chromium (drag/click moves, drawing marks, print
media and PDF page count, screenshots in light, dark and phone widths). Printing in other
browsers and "Copy image" are listed in BLOCKERS.md under "Needs a live run".
