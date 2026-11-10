# T21-remove-test-yourself-on-paper

Status: Done
Sprint: none

## Why

The user asked to remove the "Test yourself on paper" feature: quiz diagrams whose answers
print on a tear-off page (T09, T12, T13 and the paper half of T17).

## Scope

- In: the "Test yourself on paper" control in the editor (What comes next? / Play it in
  your head / Evaluate), the answer pages, the printed evaluation scale, the quiz side of
  flashcards, and the two import modes that exist only to make quizzes ("Guess the move"
  and "Guess the evaluation: a quiz after each move the annotator evaluated").
- Out: on-screen training (the "Guess the evaluation" panel, "Hide what comes next",
  turning points, candidate moves), flashcards for ordinary diagrams, the other import
  modes.

## Plan (fill in before coding)

1. Drop `Quiz`, `Diagram.quiz`, `Diagram.answerNote`, `isQuiz`, `ANSWERS_PER_PAGE`;
   `pageCount` counts diagram pages only: `src/lib/sheet.ts`
2. Delete `src/lib/quiz.ts` and `src/lib/quiz.test.ts`; move the flashcard tests to
   `src/lib/cards.test.ts`
3. Cards lose `question`, `prompt` and `quiz`: `src/lib/cards.ts`,
   `src/components/CardSheet.tsx`
4. Remove answer pages, quiz slots and `EvalScale`: `src/components/PrintSheet.tsx`
5. Remove the quiz block and its caption placeholder: `src/components/DiagramEditor.tsx`
6. Remove the `guess` and `evaluated` pick modes: `src/lib/gameImport.ts`,
   `src/components/ImportGameDialog.tsx`
7. Remove quiz, answer, visualise and eval-scale rules: `src/styles.css`
8. Update tests: `src/App.test.tsx`, `src/lib/sheet.test.ts`, `src/lib/gameImport.test.ts`,
   `src/lib/turningPoints.test.ts`, `e2e/app.spec.ts`
9. Docs: `README.md` features, `DECISIONS.md` entry.

- Data/API/migration impact: none (nothing is saved).
- Risks: leftover uses of `quiz`/`answerNote` -> typecheck catches every one.

## Acceptance criteria

- [x] The editor has no "Test yourself on paper" control; the import dialog has no quiz
      modes.
- [x] A sheet prints its diagram pages only, with marks shown; no answer pages.
- [x] Flashcards still print for ordinary diagrams (caption, continuation and marks on the
      back).
- [x] The on-screen "Guess the evaluation" panel still works.
- [x] No quiz code or styles remain.

## Verification

Say how each criterion was checked: *ran it*, *fakes/mocks*, *docs*, *not verified*.

- [x] `npm test`: ran it, 144 of 145 pass. The one failure ("compares the engine's top
      moves", expects `0.04`, gets `−0.04`) fails without this change too (see T19).
- [x] `npm run lint` / `npm run typecheck`: ran them, pass
- [x] `npm run test:e2e`: ran it, 11 of 11 pass; looked at `eval-guess.png` (editor, no
      quiz control), `import.png` (three import modes) and `cards-preview.png`
- [x] No quiz code left: grep for `quiz`, `answerNote`, `eval-scale` in `src/` and `e2e/`
      finds nothing
- [ ] Printed on paper: not verified (BLOCKERS "Needs a live run" #1 and #3 still apply)

## Notes

- The two import modes that only produced quizzes went with the feature; the three
  ordinary modes stay.
- A flashcard made from a diagram now always has the caption on the back; there is no
  "question on the front" any more.
- `ANSWER_LENGTH` became `CONTINUATION_LENGTH` in `src/lib/format.ts`.
- The unused `.select` style (only the guess-the-move side picker used it) was removed.

Close: check the boxes, set `Status: Done`, tick it in the sprint plan, `git mv` this file
to `sprints/tickets/done/`.
