# Roadmap

## The goal

The goal of this project is to have an easy gui to construct chess positions, with a label
too, and an easy way to add them to a pdf to be printed out. When they are printed I will be
cutting them up and glueing them into a handwritten book of notes I use to study chess.

## Principles every idea is weighed against

- **Paper is the record.** Nothing is saved: no library, history, autosave or sheet files.
  A sheet lives until the tab closes. Exporting one diagram as an image is fine.
- **The tool stays small; the thinking is mine.** Features earn a place only if they put
  good positions on paper to think about. No checklists, templates, study systems or
  schedules.
- **Ideas over memorised lines.** Practice features exist to make me think, not to drill.
- **The engine is for on-screen feedback only.** Printed sheets stay engine-free. Stockfish
  runs in the browser; positions never leave the computer.

Full reasoning for each is in `DECISIONS.md`.

## Done

All built on 2026-11-07 as a static web app (TypeScript, React, Vite, chess.js), with
Vitest and Playwright tests.

### Sprint 1: diagrams and note sheets
- Diagram from typed moves or a FEN, following as you type.
- Notation checker: flags the first illegal, ambiguous or misnumbered move and offers fixes.
- Arrows and circles in four colours.
- A4 print sheets: 3 diagrams a page beside ruled lines, or 6 a page; blank boards.
  Prints in greyscale with background graphics off.
- Export as PNG or SVG, copy as image, copy FEN.

### Sprint 2: getting positions in
- Set up a position by hand (copy a diagram from a book without a FEN).
- PGN import: a diagram every N moves, after listed moves, or at every annotated move with
  the comment as caption.
- The moves leading to each position print beside it, optionally in figurine notation.

### Nothing is saved (T08, between sprints 2 and 3)
- Removed autosave and sheet save/open, which were an archive by another name. The app
  deletes any sheet an earlier version saved and asks before leaving a sheet with work on it.

### Sprint 3: learning from the sheet
- Quiz diagrams ("What comes next?") with a tear-off answer page.
- "New diagram from this position" to branch a side line.
- Positions from lichess analysis/editor links or any `?fen=` URL.

### Sprint 4: practice on paper
- "Play it in your head": the next moves printed as text with no board.
- Guess the move: import a game and get a quiz before each of one side's moves.
- Fold-over flashcards from any sheet (no double-sided printing needed).

### Sprint 5: guess the evaluation
- Evaluation symbols and NAGs understood in notation; drawn as SVG so ⩲/± and ⩱/∓ are
  distinguishable.
- Stockfish 19 lite in the browser, loaded on first use.
- On screen: pick a verdict, then reveal the engine's view and best line, the annotator's
  verdict and comment, and any lichess `[%eval]`.
- On paper: evaluation quizzes with a scale to circle, answered by the annotator or me.

### Fixes to the training modes (sixth round)
- "Hide what comes next" hides the notation and later moves while guessing.
- Keys 1–8 pick a verdict.

### Turning points (seventh round)
- After analysing a game myself, the engine checks every move and lists inaccuracies,
  mistakes and blunders (lichess's win-chance thresholds), with the better move and a jump to
  the position. The positions can be added to the sheet as diagrams. Hidden while "Hide what
  comes next" is on.

### Compare moves (latest, not yet in README or DECISIONS)
- "Decide what you'd play first, then compare": the engine's top 5 moves in the current
  position. On screen only, hidden while "Hide what comes next" is on.

### Cut out (T18, 2026-11-08)
- New default print layout: 12 boards a page with number, side to move and caption, inside
  dashed cut lines, with no ruled lines or move lists, for gluing into a lined notebook.
- Flashcard fix: the move that reached the position moved from the back to the front
  ("Black to move after 5. Bb5"), and the back no longer repeats the card number.

## Ruled out

| Idea | Why not |
|---|---|
| Reading photos of handwritten notes (OCR) | Very high effort, unreliable on notation; typing with the checker covers it. |
| Python CLI with python-chess | No interactive UI; printing needed a PDF pipeline. |
| chessground board | DOM-based, so print and SVG export would need a second renderer. |
| Study library, archive, history, autosave, sheet files | Paper is the record. |
| Sharing a sheet as a link | Long games make huge URLs, and nothing is shared or saved. |
| Printable blank scoresheet | A notebook already does this. |
| US Letter paper | I print A4. Revisit if someone outside A4 countries uses it. |
| Fetching games from lichess game links | Needs the network and an API; copying the PGN works. |
| Thinking-prompt checklists / question templates | Nobody's thinking is structured like that. |
| lichess cloud-eval API | Only knows positions already analysed, needs the network, sends positions out, rate-limited. |
| Full Stockfish build (94 MB) | Too big to load in a page. |
| Engine output on printed sheets | Paper stays engine-free. |
| lichess tablebase | Sends positions out. |
| Session score in training modes | Tracking. |
| Engine time setting | Needless control. |
| Game log | History. |
| Opponent lookup | Network, and it is repertoire prep. |
| Clock-time analysis | My rated games are over the board. |

## Deferred (could come back)

- **Bundled collection of categorised positions.** Only if an excellent source exists.
  Candidate: a curated subset of the lichess puzzle database (CC0, tagged by theme), but it
  is tactics rather than endgame theory and multi-gigabyte.
- **Seven-piece tablebase answers for endgames**, or a stronger engine, if the lite
  engine's judgement proves too weak (without sending positions out).
- **Variations printed beside a diagram.** Side lines in pasted PGN are skipped for now;
  branch them into their own diagram instead.
- **Under-promotion from the board.** Board moves promote to a queen; typing `e8=N` works.

## To check by hand

From `BLOCKERS.md`; everything so far was tested in Chromium only.

- Print a 4-diagram sheet from Safari and Firefox (margins, mm sizing, clipping).
- Print a flashcard sheet, then cut and fold a card (show-through, clipped cut lines).
- Leave-page prompt in Safari and Firefox (type a move, then ⌘R).
- Stockfish in Safari, and its speed on an older machine.
- "Copy image", pasted into a document from Chrome and Safari.
- Decide whether to delete or restore `pyproject.toml` (staged for deletion).
