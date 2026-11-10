# T08-nothing-is-saved

Status: Done
Sprint: none

## Why

The user writes notes by hand so their studies live in the book, the notes and their head,
not on the computer. The app kept a copy of the sheet in the browser and offered sheet
files, which is a digital archive by another name.

## Scope

- In: remove autosave and sheet save/open; delete the sheet earlier versions saved; start
  each visit with one empty position; warn before leaving a sheet with work on it.
- Out: a study library (proposed, then dropped by the user; see DECISIONS.md).

## Plan (fill in before coding)

1. Remove persistence and add `hasContent` and `forgetSavedSheet`: `src/lib/sheet.ts`
2. In-memory sheet, `initialSheet` prop for tests, beforeunload guard, sidebar note: `src/App.tsx`
3. Rewrite storage-based tests; add leave-prompt e2e: `src/App.test.tsx`, `e2e/app.spec.ts`

- Data/API/migration impact: the legacy `chess-diagrams:sheet` localStorage key is deleted
  on load.
- Risks: losing work on an accidental refresh -> beforeunload prompt once there is content.

## Acceptance criteria

- [x] Nothing is written to browser storage; a new visit starts empty.
- [x] A sheet saved by an earlier version is deleted.
- [x] Leaving a sheet with content asks first; an empty sheet doesn't.

## Verification

- [x] `npm test` passes, 77 tests (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Playwright: the Chromium prompt appears on close; a new page is empty and localStorage
      is empty (ran it). Safari and Firefox are in BLOCKERS.md under "Needs a live run".

## Notes

Single-diagram PNG/SVG export stays: it is an image for printing, not a study.
