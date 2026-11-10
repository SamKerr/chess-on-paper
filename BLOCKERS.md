# Blockers and open decisions

Things the agent could not resolve alone. Each item says what is blocked and what unblocks
it. Delete an item once it is resolved; record lasting resolutions in `DECISIONS.md`.
Number items so tickets can point at them (`Status: Blocked (BLOCKERS #2)`).

## Needs you

_None._

<!-- Decisions, credentials, access, policy questions.
n. **<Short title>.** Blocked: <what cannot proceed>. Unblock by: <the exact action, or the
   answer needed>. Default taken meanwhile: <what the agent did instead, or "none, paused">.
-->

## Needs a live run to verify

<!-- Code that exists but was only checked against docs, mocks or fakes.
1. **<Component>.** Checked by: <docs | mocks | fakes>. Unknowns: <what could still be
   wrong>. Verify by: <command or step>.
-->

1. **Printing on paper, and in Safari and Firefox.** Checked by: Playwright in Chromium (print
   media emulation, page size, PDF page count) and screenshots. Unknowns: other browsers'
   handling of `@page { margin: 0 }` and mm sizing; printer margins clipping the 12mm page
   padding. Verify by: print a 4-diagram sheet from Safari and Firefox.
2. **Leave-page prompt in Safari and Firefox.** Checked by: Playwright in Chromium (the
   prompt appears on close after typing). Unknowns: browsers only prompt after the user has
   interacted with the page; Safari may not prompt for a closed tab. Verify by: type a move,
   then press ⌘R in Safari and Firefox.
3. **Fold-over flashcards on paper.** Checked by: Playwright (one A4 page, cards span the
   printable width) and a screenshot. Unknowns: whether the back shows through ordinary
   80gsm paper when folded, and whether printer margins clip the cut lines. Verify by:
   print a card sheet, cut and fold one card.
4. **Stockfish in Safari and Firefox.** Checked by: Playwright in Chromium (loads the WASM
   engine, finds a mate in one, rates a quiet opening as roughly level). Unknowns: WASM
   loading in other browsers, and speed on older machines (1.5 s per position by
   default). Verify by: open the app in Safari, enter a position, press "Just show me".
5. **Copy image.** Checked by: not verified (needs clipboard permission in a real browser).
   Unknowns: Safari wants the `ClipboardItem` promise form, which is what is used. Verify by:
   click "Copy image" and paste into a document in Chrome and Safari.

## Deliberately not done yet

<!-- Known gaps left out on purpose, so nobody rediscovers them as bugs.
1. **<Gap>.** Why not now: <reason>. Revisit when: <trigger>.
-->

1. **Variations are skipped, not shown.** `(…)` side lines in pasted PGN are ignored so the
   main line remains. Why not now: a diagram shows one line; to diagram a side line, paste
   it as its own position. Revisit when: someone wants variations printed beside a diagram.
