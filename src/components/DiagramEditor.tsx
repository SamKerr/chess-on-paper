import { Chess, type Square, validateFen } from "chess.js";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { copyPng, downloadPng, downloadSvg, slug } from "../lib/export";
import { mistakeDiagrams } from "../lib/turningPoints";
import { lineUpTo } from "../lib/gameImport";
import { appendMove, EMPTY_FEN, START_FEN } from "../lib/notation";
import { movePiece, placePiece, setTurn } from "../lib/setup";
import {
  MARK_COLORS,
  toggleArrow,
  toggleCircle,
  type Diagram,
  type MarkColor,
  type SheetSettings,
} from "../lib/sheet";
import { diagramTitle, diagramView } from "../lib/view";
import { Board, MARK_FILL } from "./Board";
import { CandidateMoves } from "./CandidateMoves";
import { EvalGuess } from "./EvalGuess";
import { MoveList } from "./MoveList";
import { PieceIcon, SetupPanel } from "./SetupPanel";
import { TurningPoints } from "./TurningPoints";

type Mode = "move" | "draw" | "setup";
type Promotion = "q" | "r" | "b" | "n";
const PROMOTIONS: [Promotion, string][] = [
  ["q", "Queen"],
  ["r", "Rook"],
  ["b", "Bishop"],
  ["n", "Knight"],
];

interface Props {
  diagram: Diagram;
  index: number;
  settings: SheetSettings;
  onChange: (patch: Partial<Diagram>) => void;
  /** Start a new diagram from the position on screen */
  onBranch: (notation: string, flipped: boolean) => void;
  /** Add diagrams after this one, e.g. the positions before a game's mistakes */
  onAddDiagrams: (diagrams: Diagram[]) => void;
}

export function DiagramEditor({ diagram, index, settings, onChange, onBranch, onAddDiagrams }: Props) {
  const view = diagramView(diagram);
  const { parsed, ply, fen } = view;
  const [mode, setMode] = useState<Mode>("move");
  const [setupPiece, setSetupPiece] = useState<string | null>("P");
  const [setupHistory, setSetupHistory] = useState<string[]>([]);
  // Training on screen: the notation and later moves would give the answer away.
  const [hideAhead, setHideAhead] = useState(false);
  // A pawn move to the last rank, waiting for the piece to be chosen.
  const [pending, setPending] = useState<{ fen: string; from: Square; to: Square } | null>(null);
  const [color, setColor] = useState<MarkColor>("green");
  const [status, setStatus] = useState("");
  const boardRef = useRef<SVGSVGElement>(null);
  const notationRef = useRef<HTMLTextAreaElement>(null);
  const ids = { notation: useId(), caption: useId(), problem: useId() };
  const isBlank = diagram.kind === "blank";
  const atEnd = ply === parsed.plies.length;
  const canPlay = !isBlank && atEnd && !parsed.problem;
  const totalPlies = parsed.plies.length;

  const flash = (text: string) => {
    setStatus(text);
    window.setTimeout(() => setStatus((s) => (s === text ? "" : s)), 2500);
  };

  const goTo = useCallback(
    (p: number) => onChange({ ply: p >= totalPlies ? null : Math.max(0, p) }),
    [onChange, totalPlies],
  );

  // Arrow keys step through the moves, unless you're typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") goTo(ply - 1);
      else if (e.key === "ArrowRight") goTo(ply + 1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(totalPlies);
      else if (e.key.toLowerCase() === "f") onChange({ flipped: !diagram.flipped });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, ply, totalPlies, onChange, diagram.flipped]);

  const legalTargets = (from: Square): Square[] => {
    try {
      return new Chess(fen).moves({ square: from, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  };

  const playMove = (from: Square, to: Square, promotion?: Promotion) => {
    let san: string;
    try {
      const game = new Chess(fen);
      if (!promotion && game.moves({ square: from, verbose: true }).some((m) => m.to === to && m.promotion)) {
        setPending({ fen, from, to });
        return;
      }
      san = game.move({ from, to, promotion }).san;
    } catch {
      return;
    }
    setPending(null);
    onChange({ notation: appendMove(diagram.notation, fen, san), ply: null });
  };
  // Only while the position the pawn moved in is still on the board.
  const promoting = pending && pending.fen === fen && canPlay ? pending : null;

  const draw = (from: Square, to: Square, keys: { shiftKey: boolean; altKey: boolean }) => {
    const c: MarkColor = keys.shiftKey ? "red" : keys.altKey ? "blue" : color;
    if (from === to) onChange({ circles: toggleCircle(diagram.circles, { square: from, color: c }) });
    else onChange({ arrows: toggleArrow(diagram.arrows, { from, to, color: c }) });
  };

  /** Setup edits replace the notation with a FEN; keep the old text so Undo can restore it. */
  const applySetup = (nextFen: string) => {
    if (nextFen === fen && diagram.notation.trim() === fen) return;
    setSetupHistory((h) => [...h.slice(-49), diagram.notation]);
    onChange({ notation: nextFen, ply: null });
  };

  const setup = (from: Square, to: Square) => {
    applySetup(from === to ? placePiece(fen, from, setupPiece) : movePiece(fen, from, to));
  };

  const undoSetup = () => {
    const previous = setupHistory[setupHistory.length - 1];
    if (previous === undefined) return;
    setSetupHistory((h) => h.slice(0, -1));
    onChange({ notation: previous, ply: null });
  };

  const selectProblem = () => {
    const el = notationRef.current;
    if (!el || !parsed.problem) return;
    el.focus();
    el.setSelectionRange(parsed.problem.start, parsed.problem.end);
  };

  const applySuggestion = (san: string) => {
    const p = parsed.problem;
    if (!p) return;
    const original = diagram.notation.slice(p.start, p.end);
    const number = /^\d+(\.\.\.|…|\.)\s*/.exec(original)?.[0] ?? "";
    onChange({
      notation: diagram.notation.slice(0, p.start) + number + san + diagram.notation.slice(p.end),
    });
  };

  const filename = slug(diagramTitle(diagram, index), `diagram-${index + 1}`);
  const marks = diagram.arrows.length + diagram.circles.length;

  return (
    <section className="editor" aria-label="Edit diagram">
      <div className="editor-board">
        <div className="toolbar" role="toolbar" aria-label="Board tools">
          {!isBlank && (
            <div className="segmented" role="radiogroup" aria-label="Board mode">
              {(["move", "draw", "setup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  className={mode === m ? "on" : ""}
                  onClick={() => setMode(m)}
                >
                  {m === "move" ? "Move" : m === "draw" ? "Draw" : "Set up"}
                </button>
              ))}
            </div>
          )}
          <div className="swatches" role="radiogroup" aria-label="Mark colour">
            {MARK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                title={`${c[0].toUpperCase()}${c.slice(1)} marks`}
                className={`swatch ${color === c ? "on" : ""}`}
                style={{ background: MARK_FILL[c] }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <span className="toolbar-spacer" />
          <button type="button" className="btn ghost" onClick={() => onChange({ flipped: !diagram.flipped })} title="Flip board (F)">
            ⇅ Flip
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={marks === 0}
            onClick={() => onChange({ arrows: [], circles: [] })}
          >
            Clear marks
          </button>
        </div>
        <Board
          ref={boardRef}
          className="board-large"
          fen={fen}
          flipped={diagram.flipped}
          coordinates={settings.coordinates}
          toMove={settings.toMove && !isBlank}
          lastMove={settings.lastMove ? view.lastMove : null}
          arrows={diagram.arrows}
          circles={diagram.circles}
          showPieces={!isBlank}
          label={`${diagramTitle(diagram, index)}. ${isBlank ? "Empty board" : `${view.toMove === "white" ? "White" : "Black"} to move`}`}
          mode={isBlank ? "draw" : mode}
          drawColor={color}
          onDraw={draw}
          onMove={canPlay ? playMove : undefined}
          onSetup={isBlank ? undefined : setup}
          legalTargets={canPlay ? legalTargets : undefined}
        />
        {promoting && (
          <div className="promotion" role="group" aria-label="Promote to">
            <span className="label">Promote to</span>
            {PROMOTIONS.map(([p, name], i) => (
              <button
                key={p}
                type="button"
                className="palette-piece"
                aria-label={name}
                title={name}
                autoFocus={i === 0}
                onClick={() => playMove(promoting.from, promoting.to, p)}
              >
                <PieceIcon piece={view.toMove === "white" ? p.toUpperCase() : p} />
              </button>
            ))}
            <button type="button" className="btn small ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}
        <p className="hint">
          {isBlank
            ? "Drag to draw an arrow, click a square to circle it."
            : mode === "setup"
              ? "Click a square to place the chosen piece (click again to remove it). Drag to move a piece."
              : mode === "move"
              ? canPlay
                ? "Drag or click pieces to add moves. Right-drag draws arrows; right-click circles a square."
                : parsed.problem
                  ? "Fix the notation problem to add more moves from the board."
                  : "Go to the last move to add moves from the board. Right-drag still draws."
              : "Drag to draw an arrow, click a square to circle it. Shift for red, Alt for blue."}
        </p>
      </div>

      <div className="editor-side">
        {!isBlank && mode === "setup" && (
          <SetupPanel
            fen={fen}
            piece={setupPiece}
            onPiece={setSetupPiece}
            onTurn={(t) => applySetup(setTurn(fen, t))}
            onPreset={(p) => applySetup(p === "start" ? START_FEN : EMPTY_FEN)}
            onUndo={setupHistory.length > 0 ? undoSetup : null}
            hasMoves={totalPlies > 0}
          />
        )}
        {!isBlank && (
          <div className="field">
            <label htmlFor={ids.notation}>Moves or FEN</label>
            {hideAhead ? (
              <div className="notation-hidden">
                <span>Hidden while you train, so it can’t give away what comes next.</span>
                <button type="button" className="btn small" onClick={() => setHideAhead(false)}>
                  Show
                </button>
              </div>
            ) : (
            <textarea
              id={ids.notation}
              ref={notationRef}
              className="notation"
              rows={4}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="1.e4 e5 2.Nf3 Nc6, or paste a FEN, a PGN or a lichess analysis link"
              value={diagram.notation}
              aria-invalid={parsed.problem ? true : undefined}
              aria-describedby={parsed.problem ? ids.problem : undefined}
              onChange={(e) => onChange({ notation: e.target.value, ply: null })}
            />
            )}
            {parsed.problem ? (
              <div className="problem" id={ids.problem} role="alert">
                <p>{parsed.problem.message}</p>
                <div className="problem-actions">
                  <button type="button" className="btn small" onClick={selectProblem}>
                    Show in text
                  </button>
                  {parsed.problem.suggestions.map((s) => (
                    <button key={s} type="button" className="btn small chip" onClick={() => applySuggestion(s)}>
                      Use {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="ok" aria-live="polite">
                {totalPlies > 0 ? `✓ ${totalPlies} ${totalPlies === 1 ? "move" : "moves"} checked` : "Starting position"}
              </p>
            )}
          </div>
        )}

        {!isBlank && totalPlies > 0 && (
          <MoveList
            parsed={parsed}
            ply={ply}
            onSelect={goTo}
            figurines={settings.figurines}
            hideAhead={hideAhead}
            onHideAhead={setHideAhead}
          />
        )}

        {!isBlank && !hideAhead && (
          <TurningPoints
            key={diagram.notation}
            parsed={parsed}
            onSelect={goTo}
            figurines={settings.figurines}
            onAdd={(points) => onAddDiagrams(mistakeDiagrams(diagram.notation, points))}
          />
        )}

        {!isBlank && !hideAhead && validateFen(fen).ok && (
          <CandidateMoves key={`c-${fen}`} fen={fen} figurines={settings.figurines} />
        )}

        {!isBlank && (
          <EvalGuess
            key={fen}
            fen={fen}
            lastPly={ply > 0 ? parsed.plies[ply - 1] : null}
            canAnalyse={validateFen(fen).ok}
            onNext={ply < totalPlies ? () => goTo(ply + 1) : null}
            figurines={settings.figurines}
          />
        )}

        {!isBlank && (
          <button
            type="button"
            className="btn ghost branch-btn"
            onClick={() => onBranch(lineUpTo(parsed, ply), diagram.flipped)}
            title="Explore a side line from here in its own diagram"
          >
            ↳ New diagram from this position
          </button>
        )}

        <div className="field">
          <label htmlFor={ids.caption}>Caption</label>
          <textarea
            id={ids.caption}
            rows={2}
            placeholder="What should you remember about this position?"
            value={diagram.caption}
            onChange={(e) => onChange({ caption: e.target.value })}
          />
        </div>

        <div className="export-row">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              if (!boardRef.current) return;
              try {
                flash((await copyPng(boardRef.current)) ? "Image copied" : "Copying images isn't supported here");
              } catch {
                flash("Couldn't copy the image");
              }
            }}
          >
            Copy image
          </button>
          <button type="button" className="btn" onClick={() => boardRef.current && downloadPng(boardRef.current, `${filename}.png`)}>
            PNG
          </button>
          <button type="button" className="btn" onClick={() => boardRef.current && downloadSvg(boardRef.current, `${filename}.svg`)}>
            SVG
          </button>
          {!isBlank && (
            <button
              type="button"
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(fen);
                  flash("FEN copied");
                } catch {
                  flash("Couldn't reach the clipboard");
                }
              }}
            >
              Copy FEN
            </button>
          )}
          <span className="status" role="status">
            {status}
          </span>
        </div>
      </div>
    </section>
  );
}
