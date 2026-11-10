# T03-print-sheets

Status: Done
Sprint: sprint-1

## Why

A4 pages: 3 diagrams beside ruled lines, or 6 a page; blank boards; printable without background graphics.

## Scope

- In: as above.
- Out: see sprint-1 Scope.

## Plan (fill in before coding)

1. Build in `src/components/PrintSheet.tsx, src/styles.css`.

- Data/API/migration impact: none (new project).
- Risks: browser-only behaviour untested in jsdom -> Playwright covers pointer and print.

## Acceptance criteria

- [x] Behaviour described in Why works in the app.
- [x] Covered by automated tests.

## Verification

- [x] `npm test` passes (ran it)
- [x] `npm run lint` / `npm run typecheck` pass (ran it)
- [x] Component test for page count; Playwright print media, page size 210x297mm, 2-page PDF; screenshots reviewed. (ran it)

## Notes

See DECISIONS.md (2026-11-07) for stack and feature choices.
