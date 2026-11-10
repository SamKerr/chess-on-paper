```text
┌─╴ ╷ ╷ ┌─╴ ┌─╴ ┌─╴   ┌─┐ ┌┐╷   ┌─┐ ┌─┐ ┌─┐ ┌─╴ ┌─┐
│   ├─┤ ├─╴ └─┐ └─┐   │ │ │││   ├─┘ ├─┤ ├─┘ ├─╴ ├┬┘
└─╴ ╵ ╵ └─╴ ╶─┘ ╶─┘   └─┘ ╵└┘   ╵   ╵ ╵ ╵   └─╴ ╵└╴
```

![Chess on Paper: the editor, with the board, move entry and print options](docs/app-screenshot.png)

**Print positions. Study by hand.** Print-ready chess diagrams and A4 sheets for people who
study chess on paper.

- **Type moves the way you write them** (`1.e4 e5 2.Nf3`, `0-0`, `exd5!?`, `{comments}`;
  lower case such as `nf3` works too),
  paste a FEN, a PGN or a lichess analysis link, or play moves on the board (a pawn reaching the
  last rank asks which piece to promote to). The diagram follows as you type.
- **Notation checker.** The first illegal, ambiguous or misnumbered move is flagged with
  its move number, selected in your text, and offered fixes ("Use Nf3").
- **Set up a position by hand** to copy a diagram from a book: pick a piece, click squares,
  drag pieces around, choose the side to move. No FEN needed.
- **Import a game (PGN)** and get diagrams every N moves, after the moves you list, or at
  every move marked `!`/`?`/`$n` or commented, with the comment as the caption.
- **Arrows and circles** in four colours: right-drag on the board, or switch to Draw.
- **Step through the moves** to pick which position the diagram shows, and branch a side
  line into its own diagram with "New diagram from this position".
- **Guess the evaluation** on screen: step through a game, pick your verdict (+− ± ⩲ = ⩱
  ∓ −+ ∞), then reveal Stockfish's view and best line, the annotator's verdict and
  comment, and any evaluation stored in a lichess export. Stockfish runs in the browser
  (about 2 MB, loaded on first use); positions never leave your computer. Keys 1–8 pick
  a verdict, and "Hide what comes next" hides the notation and later moves while you train.
- **Turning points**: after analysing a game yourself, let the engine check every move and
  list the inaccuracies, mistakes and blunders (by lost winning chances, on lichess's
  thresholds), each with the better move and a jump to the position before it.
- **Flashcards**: print any sheet as fold-over cards (cut, fold, done; no double-sided
  printing). The sheet title is the deck name.
- **Print sheets on A4**: 6 diagrams a page, each with ruled lines for notes.
  Blank boards for drawing positions by hand. The moves leading to each position print
  beside it, optionally in figurine notation. Works with "background graphics" off.
- **Export** a diagram as PNG or SVG, copy it as an image, or copy its FEN.
- **Nothing is saved.** A sheet lives until you close the tab; the paper is the record.
  The app asks before you leave a sheet with work on it.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run test:e2e   # browser tests (first: npx playwright install chromium)
```

**Run it from the Dock (macOS):** `npm run mac-app` builds `~/Applications/Chess on Paper.app`
and adds it to the Dock. Clicking it rebuilds if the code changed, serves the app on
http://localhost:4317 and opens it in your default browser. The server keeps running in the
background (`pkill -f "vite.*preview"` stops it); the log is
`~/Library/Logs/chess-on-paper.log`. Re-run `npm run mac-app` if you move the project folder.

## Licence

Chess on Paper is free software under the GNU General Public License, version 3; see
[`LICENSE`](LICENSE).

- Piece artwork: the cburnett set by Colin M.L. Burnett (BSD/GPL/GFDL), via python-chess.
- Engine: Stockfish 19 (GPL-3.0) via stockfish.js, vendored unmodified in `public/engine/`
  with its licence text; [`public/engine/README.md`](public/engine/README.md) says where
  its source is.
