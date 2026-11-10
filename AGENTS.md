# AGENTS.md

<!-- Keep this file short: it is read on every task. Fill in the <placeholders>, delete what
does not apply, and move detail into the files it points to. Cursor reads this file
natively; Claude Code reads it through CLAUDE.md. -->

## Project

Chess on Paper: a static web app for making print-ready chess diagrams and A4 note
sheets, for people who write their chess study notes by hand. It checks hand-written
notation, draws arrows and circles, and prints diagrams beside ruled lines.

- Stack: TypeScript, React 19, Vite, chess.js; npm. No backend and no persistence: a sheet
  lives in memory until the tab closes.
- Layout: `src/lib/` pure logic (notation parsing, sheet model, geometry, export),
  `src/components/` React UI, `src/*.test.ts(x)` and `src/lib/*.test.ts` unit and component
  tests, `e2e/` Playwright browser tests, `sprints/` plans and tickets
- Conventions: `.cursor/rules/project-conventions.mdc`

## Commands

- `npm install` installs dependencies. `npx playwright install chromium` once for e2e.
- `npm test` runs unit and component tests (Vitest + jsdom). Needs nothing.
- `npm run test:e2e` builds, serves on :4173 and runs Playwright in Chromium. Screenshots
  land in `test-results/screens/`; look at them after UI changes.
- `npm run lint` lints. `npm run typecheck` type-checks.
- `npm run dev` starts the app locally. `npm run build` builds to `dist/`.
- `npm run mac-app` installs a macOS Dock launcher (`scripts/install-mac-app.sh`); it
  serves `dist/` on :4317 via `scripts/mac-app/launch.sh`.
- A push to `master` runs `.github/workflows/deploy.yml`: install, lint, typecheck, unit
  tests and build, then `dist/` goes to GitHub Pages at
  https://samkerr.github.io/chess-on-paper/. The e2e tests do not run in CI.

A change is not done until the relevant commands pass. Run them; do not assume.

## Rules

- Notation parsing never throws: it returns the moves that parsed plus one `problem`.
- Diagrams must print well in greyscale: board colours are inline SVG attributes, not CSS.
- Anything printed must work with the browser's "background graphics" switched off.
- Nothing is saved: no localStorage, IndexedDB, sheet files, history or library. Paper is
  the record (DECISIONS.md, "Lines held"). Exporting a single diagram image is fine.
- The engine is for on-screen feedback only. Printed sheets stay engine-free unless the
  user sets an answer themselves. Stockfish runs locally; never send positions to a
  service.

## How to work

**Scale the process to the change.**

| Size | Examples | Process |
|---|---|---|
| Small | typo, one-function fix, config tweak | Do it, verify it, mention it in your summary. |
| Medium | a feature in one area, a refactor across a few files | A ticket in `sprints/tickets/` with its plan filled in, then build. |
| Large | multi-area feature, new subsystem, several sessions | A sprint plan in `sprints/plans/` plus tickets. Agree scope with the user first. |

**When you hit a question the code, docs or a sensible default cannot answer:**

- If it blocks the current step and the user is around, ask one specific question.
- Otherwise do not stop. Take the safest reversible default, record it in `BLOCKERS.md`
  ("Default taken meanwhile"), and carry on with work that does not depend on it.
- Never guess on anything irreversible or outward-facing (see Safety).
- Check `DECISIONS.md` before proposing something that may already have been decided.

**Keep `BLOCKERS.md` current.** It is the handoff to the human. Add an item the moment you
are blocked; delete it once resolved, moving lasting resolutions to `DECISIONS.md`. Every
item says what is blocked and the exact action that unblocks it.

**Report verification honestly.** For each claim, say how it was checked: *ran it*,
*tested with fakes/mocks*, *checked against docs*, or *not verified*. Never write "works"
for code you did not run. External behavior checked only against docs or mocks goes in
`BLOCKERS.md` under "Needs a live run".

**Habits:**

- Read before you edit. Integrate with in-progress work; never revert the user's changes.
- Keep changes focused. Do not change unrelated behavior or reformat untouched code.
- Prefer the existing pattern and the simplest thing that works.
- Update docs and this file when commands, setup or behavior change.

## Delegation

When splitting work across subagents:

- Plan centrally and give each agent the files it owns. No two agents edit the same file.
- Tell each agent to re-read files before editing and to report how it verified its work.
- Run read-only review agents first, then fix agents split by area.
- Run the full test suite yourself after they report. Their summary is not verification.

Personas live in `.cursor/agents/` (`.claude/agents/` is a symlink to it).

## Sprints and tickets

- Plans: `sprints/plans/sprint-<n>.md` from `sprints/plans/TEMPLATE.md`. One file per
  sprint number; never merge sprints.
- Tickets: `sprints/tickets/T<nn>-<short-title>.md` from `sprints/tickets/TEMPLATE.md`.
  Fill in its Plan section before coding.
- Close a ticket as soon as its acceptance criteria pass: check the boxes, set
  `Status: Done`, tick it in the sprint plan, `git mv` it to `sprints/tickets/done/`.
- Close a sprint when its tickets are done or explicitly moved out: fill in Outcome,
  `git mv` the plan to `sprints/plans/done/`.
- A blocked ticket gets `Status: Blocked (BLOCKERS #<n>)`.

Closing the paperwork is part of the deliverable.

## Safety

- Never push, deploy, publish, post, send messages or open PRs/MRs unless the user asked
  for that specific action. Commit only when asked.
- Never commit secrets or `.env` files. `.env.example` holds variable names only.
- Never edit `ROADMAP.md` or other user-owned drafts unless asked.
- Before deleting, overwriting or `reset --hard`, look at the target and confirm unless
  the user already said to.
