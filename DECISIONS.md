# Decisions

Choices that should not be relitigated. Check here before proposing an alternative. Add an
entry when the user decides something, or accepts a default an agent took from
`BLOCKERS.md`. Newest first.

## Lines held

<!-- Things this project will not do, whatever the request. -->

- **Paper is the record.** No library, archive, history or database of studies, local or
  synced, and no autosave or sheet files. The user writes notes by hand so that studies
  live in the book, the notes and their head, not on the computer. The app prepares a
  sheet, prints it, and forgets it when the tab closes; it asks before leaving a sheet with
  work on it. Exporting one diagram as an image is allowed. (2026-11-07)
- **The tool stays small; the thinking is the user's.** No structured checklists or
  question templates for evaluating positions ("nobody's thinking is structured like
  that"), no study systems or schedules. Features earn a place only if they put good
  positions on paper to think about. Prefer doing less. (2026-11-07)

## Log

### 2026-11-10: The app is called "Chess on Paper" (chess-on-paper)
- Context: it was "Chess Notes" on screen and `chess-diagrams` as a repo and package.
- Decision: display name "Chess on Paper", slug `chess-on-paper` (repo, package name, URL
  path), tagline "Print positions. Study by hand."
- Why: the app prints positions for analogue study. "Chess Notes" suggested a note-taking
  app (the opposite), collided with a well-known chess column, and didn't match the repo.
- Kept: the legacy storage key `chess-diagrams:sheet`, which exists only to delete data
  saved by old versions, and earlier records, which keep the names of their time.

### 2026-11-10: Lower-case moves are accepted
- Context: the user asked to type `nf3` as well as `Nf3`.
- Decision: a move that isn't legal as written is matched against the legal moves without
  regard to case. The text as written wins, so `bxc3` is the b-pawn's capture whenever
  that is legal and the bishop's only otherwise; a capital `B` is always a bishop.
- Revisit if: the `b` rule surprises (a mistyped pawn capture silently becoming a bishop
  move).

### 2026-11-10: "Test yourself on paper" is removed
- Context: the user asked for the feature to go.
- Decision: quiz diagrams ("What comes next?", "Play it in your head", "Evaluate"), their
  answer pages, the printed evaluation scale and the two import modes that only made
  quizzes ("Guess the move", "Guess the evaluation") are removed. Diagrams always print
  with their marks. Supersedes the quiz parts of the third, fourth and
  guess-the-evaluation entries below.
- Kept: on-screen training (the "Guess the evaluation" panel, "Hide what comes next",
  turning points, candidate moves) and flashcards, whose back shows the caption, the
  continuation and the marks.
- Revisit if: the user wants to self-test from printouts again; flashcards cover the
  simple case meanwhile.

### 2026-11-08: "6 per page" is the only diagram layout
- Context: the user only uses 6 boards a page.
- Decision: "Cut out" (12 a page) and "With notes" (3 a page) are removed; "6 per page" is
  the default and the only diagram-page layout. Flashcards stay. Supersedes the entry
  below.
- Revisit if: the user asks for a different number of boards a page.

### 2026-11-08: "Cut out" is the default print layout (superseded above)
- Context: the user cuts diagrams out and glues them into an already-lined notebook, so
  ruled lines and the moves column beside each board were wasted.
- Decision: a "Cut out" layout, 12 boards a page (3 by 4, 44 mm boards) with number, side
  to move and caption inside dashed cut lines. It is the default because settings are not
  saved, so any other default would need changing on every visit.
- Revisit if: the boards are too small or too big for the notebook.

### 2026-11-07: Seventh round: turning points
- Built: the engine checks a whole game (0.3 s a position) and lists moves that lost at
  least a fifth of the mover's winning chances, on lichess's win-chance curve and
  thresholds. On screen only; the panel says to analyse the game yourself first, and it
  hides while "Hide what comes next" is on.
- Why: the user plays about one rated game a week, and analysing their own games is the
  highest-value habit for them; this is its feedback step.
- Rejected: a game log (history), opponent lookup (network, repertoire), clock-time
  analysis (their rated games are over the board).

### 2026-11-07: Sixth round: only fixes to the training modes
- Built: "Hide what comes next" (the notation box and later moves gave answers away while
  guessing on screen) and keys 1-8 for verdicts.
- Rejected: lichess tablebase (sends positions out), a session score (tracking), engine
  time setting (needless control).

### 2026-11-07: Guess the evaluation, with Stockfish in the browser
- Context: the user asked for engine evaluations, and to guess the evaluation while going
  through games.
- Decision: Stockfish 19 lite (single-threaded WASM, ~1.9 MB, GPL-3.0) vendored in
  `public/engine/`, run in a Web Worker and loaded on first use. On screen: guess first,
  then reveal the engine (symbol, words, score, best line), the annotator's verdict and
  comment, and any lichess `[%eval]` in the game. On paper: evaluation quizzes with a
  scale to circle, answered by the annotator or the user; no engine output is printed.
- Engine scores map to symbols at 0.3 / 0.9 / 2.0 pawns, a common convention.
- Evaluation symbols are drawn as SVG, not font glyphs: in common fonts ⩲ is
  indistinguishable from ±, and ⩱ from ∓.
- Imported diagrams now keep the original game text (annotations included) instead of
  a cleaned move list, so evaluations and comments stay available.
- Rejected: the lichess cloud-eval API. It only knows positions already analysed on
  lichess, needs the network, sends positions out and is rate-limited. The full
  Stockfish build (94 MB) is too big to load in a page.
- Revisit if: the lite engine's judgement proves too weak, or seven-piece tablebase
  answers are wanted for endgames.

### 2026-11-07: Fourth round: guess-the-move, calculation sheets, flashcards
- Built: guess-the-move import, "play it in your head" quizzes, and printing any sheet as
  fold-over flashcards (front and back side by side, folded vertically, so any printer
  works without double-sided alignment).
- Flashcards are made from the user's own positions; the sheet is the deck/category.
- Not built: a bundled collection of categorised positions. The user said to skip it
  unless an excellent source exists. Candidate: the lichess puzzle database (CC0,
  engine-checked, tagged by theme such as rook endgame, smothered mate, opening). It is
  tactics, not endgame theory, and multi-gigabyte, so it would need a curated subset.
  No open, categorised endgame-theory source of similar quality was found.
- Thinking-prompt checklists stay out (see Lines held).

### 2026-11-07: Third feature round, weighed against "paper is the record"
- Built: quiz diagrams with a tear-off answer page (self-testing on paper is how the
  user's memory becomes the library), branching a side line into a new diagram, and
  positions from lichess analysis/editor links or any `?fen=` URL.
- Rejected: a printable blank scoresheet (a notebook does this) and US Letter paper
  (the user prints A4). Revisit Letter if someone outside A4 countries uses it.
- Game links (lichess.org/<id>) are not fetched: that needs the network and an API, and
  copying the PGN works. The app says so when such a link is pasted.

### 2026-11-07: Second feature round, weighed for handwritten notes
- Built: position set-up by hand, PGN game import (every N moves / listed moves /
  annotated moves), the moves so far printed beside each diagram, figurine notation.
- Figurines are drawn with the board's piece artwork (inline SVG), not Unicode glyphs:
  font fallback made the glyphs tiny and inconsistent, and they may not print.
- Deferred: quiz sheets (hide the continuation, answers on the last page). Useful for
  training but not for notes; medium effort. Revisit if: the user trains with printouts.
- Rejected for now: sharing a sheet as a link. Sheet files already move sheets between
  devices, and long games would make huge URLs.

### 2026-11-07: Static web app in TypeScript, React, Vite and chess.js
- Context: the repo had no code; the user asked for whatever tech fits, working, well
  tested, with a nice UI, to help write chess notes by hand.
- Decision: a static single-page app with no backend. chess.js for move legality, an
  own SVG board renderer (one component for screen, print and export), Vitest and
  Testing Library for logic and UI, Playwright for pointer, print and layout checks.
- Rejected: a Python CLI with python-chess (was the first sketch; no interactive UI, and
  printing would need a PDF pipeline). chessground for the board (DOM-based, so printing
  and SVG export would need a second renderer).
- Revisit if: sheets need syncing across devices or sharing between people.

### 2026-11-07: First feature set, weighed for handwritten notes
- Built: diagram from moves/FEN, notation checker with fixes, arrows/circles, A4 print
  sheets with ruled lines and blank boards, PNG/SVG/FEN export.
- Rejected: reading photos of handwritten notes into moves (OCR). Very high effort, and
  unreliable on chess notation; typing moves with the checker covers the need.

<!--
### YYYY-MM-DD: <decision in one line>
- Context: <why it came up>
- Decision: <what was chosen>
- Rejected: <alternatives and why>
- Revisit if: <condition>
-->
