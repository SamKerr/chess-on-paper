# Sprint 4: Practice on paper

Goal: sheets support active practice (guessing moves, calculating in your head, recalling
from cards) without the app storing anything.

## Scope

- In: guess-the-move import, "play it in your head" quizzes, fold-over flashcards.
- Out: a bundled position collection (deferred by the user), thinking-prompt checklists
  (rejected).

## Tickets (in order)

- [x] T12-quiz-kinds-and-visualisation
- [x] T13-guess-the-move
- [x] T14-flashcards

## Done when

- Every ticket is done or explicitly moved out (with a note)
- `npm test`, `npm run lint` and `npm run typecheck` pass on the whole repo
- Docs and `AGENTS.md` updated if commands, setup or behavior changed
- `BLOCKERS.md` lists anything left open

## Outcome (fill in at close)

Shipped all three on 2026-11-07. Verified by running: typecheck, lint, 104 Vitest tests,
build, 9 Playwright tests in Chromium (including a one-page PDF of flashcards). Print
screenshots reviewed. Folding real cards is in BLOCKERS.md under "Needs a live run".
