# T19-six-per-page-only

Status: Done
Sprint: none

## Why

The user only wants one diagram-page layout: "6 per page". "Cut out" (12 a page, T18) and
"With notes" (3 a page beside ruled lines) go. Flashcards stay.

## Scope

- In: drop the `cutout` and `notes` layouts from the model, the Page picker, the print
  view, the styles, tests and docs. "6 per page" becomes the default.
- Out: changes to the 6-per-page or flashcard layouts themselves.

## Plan (fill in before coding)

1. `Layout` becomes `"grid" | "cards"`, default `grid`; `PER_PAGE` loses the two entries:
   `src/lib/sheet.ts`
2. Page picker shows "6 per page" and "Flashcards"; drop the cut-out-only option filter:
   `src/App.tsx`
3. Remove the cut-out branches: `src/components/PrintSheet.tsx`
4. Remove `.layout-notes` and `.layout-cutout` rules: `src/styles.css`
5. Drop the "6-per-page layout suits this" hint, now always true:
   `src/components/ImportGameDialog.tsx`
6. Update tests: `src/App.test.tsx`, `src/lib/sheet.test.ts`, `e2e/app.spec.ts`
7. Docs: `README.md` features, `DECISIONS.md` entry superseding "Cut out is the default".

- Data/API/migration impact: none (nothing is saved).
- Risks: other code keyed on `"notes"` layout -> typecheck catches every use of `Layout`.

## Acceptance criteria

- [x] The Page picker offers only "6 per page" and "Flashcards"; "6 per page" is selected
      on a new sheet.
- [x] A new sheet prints 6 boards a page with ruled lines and moves, as before.
- [x] No `cutout`/`notes` layout code or styles remain.

## Verification

- [x] `npm test`: ran it, 157 of 158 pass. The one failure ("compares the engine's top
      moves", expects `0.04`, gets `−0.04`) fails without this change too.
- [x] `npm run lint` / `npm run typecheck`: ran them, pass
- [x] `npm run test:e2e`: ran it, 11 of 11 pass; `preview.png` shows only "6 per page" and
      "Flashcards" in the picker, 6-a-page grid in the preview
- [x] No cutout/notes code left: grep for `cutout`, `layout-notes`, `"notes"` in `src/`

## Notes

Kept the internal layout name `grid` to avoid churn. Dropped the import dialog's
"6-per-page layout suits this" hint, since that is now the only layout.

Close: check the boxes, set `Status: Done`, tick it in the sprint plan, `git mv` this file
to `sprints/tickets/done/`.
