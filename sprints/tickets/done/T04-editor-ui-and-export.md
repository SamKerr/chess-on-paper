# T04-editor-ui-and-export

Status: Done
Sprint: sprint-1

## Why

Sheet editor: diagram list, notation box with fixes, move stepper, captions, settings, persistence, sheet files, PNG/SVG/FEN export.

## Scope

- In: as above.
- Out: see sprint-1 Scope.

## Plan (fill in before coding)

1. Build in `src/App.tsx, src/components/*.tsx, src/lib/sheet.ts, src/lib/view.ts, src/lib/export.ts`.

- Data/API/migration impact: none (new project).
- Risks: browser-only behaviour untested in jsdom -> Playwright covers pointer and print.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Component tests for each flow; screenshots at desktop, dark and 390px widths; no horizontal overflow on phones. (ran it)

## Notes

See DECISIONS.md (2026-11-07) for stack and feature choices.
