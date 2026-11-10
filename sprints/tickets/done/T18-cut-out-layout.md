# T18-cut-out-layout

Status: Done
Sprint: none

## Why

The user cuts printed diagrams out and glues them into a notebook that is already lined.
The ruled lines and the moves column beside each board waste paper and get cut off anyway.
Turning both off still leaves an empty column, so each page holds only 3 boards.

## Scope

- In: a "Cut out" layout: boards only, with number, side to move and caption underneath,
  12 a page (3 by 4), dashed cut lines; it is the default layout, since settings are not
  saved between visits. Quiz markers and the evaluation scale stay, as they belong to the
  diagram.
- Out: choosing the board size; changing the other layouts.

## Plan (fill in before coding)

1. Add `"cutout"` to `Layout`, 12 per page, make it the default: `src/lib/sheet.ts`
2. Slot renders no moves or ruled lines in cut-out: `src/components/PrintSheet.tsx`
3. Grid of 3 by 4 slots, dashed borders, caption under the board: `src/styles.css`
4. Layout button "Cut out"; hide "Ruled lines" and "Print the moves so far" when it is on:
   `src/App.tsx`
5. Tests: `src/App.test.tsx`, `e2e/app.spec.ts`; README line.

- Data/API/migration impact: none (nothing is saved).
- Risks: long captions overflow the slot -> clamp to two lines.

## Acceptance criteria

- [x] "Cut out" prints 12 boards a page with no ruled lines or move lists.
- [x] Each board keeps its number, side to move and caption, inside a dashed cut line.
- [x] A new sheet starts in "Cut out".
- [x] Cut lines print with background graphics off.

## Verification

- [x] `npm test` passes
- [x] `npm run lint` / `npm run typecheck` pass
- [x] `npm run test:e2e` passes; cut-out preview screenshot reviewed

## Notes

- Verified: typecheck and lint pass; Vitest 158 pass, 1 fails (the compare-moves score sign,
  "−0.04" vs "0.04", in the unrelated in-progress candidate-moves panel); Playwright 11 pass
  in Chromium. Cut-out and card screenshots reviewed: the first one showed the line under the
  board wrapping and the caption clipped, fixed with a one-line 8pt caption and 44 mm boards.
- Cut lines are borders, so they print with background graphics off (not printed on paper yet).
- Also fixed, at the user's request: flashcard backs showed the card number and the move
  leading to the position; that move is now on the front, and the back shows only the answer.

Close: check the boxes, set `Status: Done`, tick it in the sprint plan, `git mv` this file
to `sprints/tickets/done/`.
