# Sprint 3: Learning from the sheet

Goal: printed sheets help you remember positions, not just record them, and positions get
in from more places.

## Scope

- In: quiz diagrams with an answer page, branching to a new diagram, positions from links.
- Out: blank scoresheets and Letter paper (rejected); see DECISIONS.md.

## Tickets (in order)

- [x] T09-quiz-diagrams
- [x] T10-branch-diagram
- [x] T11-positions-from-links

## Done when

- Every ticket is done or explicitly moved out (with a note)
- `npm test`, `npm run lint` and `npm run typecheck` pass on the whole repo
- Docs and `AGENTS.md` updated if commands, setup or behavior changed
- `BLOCKERS.md` lists anything left open

## Outcome (fill in at close)

Shipped all three on 2026-11-07. Verified by running: typecheck, lint, 92 Vitest tests,
build, and 8 Playwright tests in Chromium; the new e2e test prints a quiz plus a branched
diagram and checks the PDF has exactly two A4 pages. Screenshots of the editor and print
preview reviewed.
