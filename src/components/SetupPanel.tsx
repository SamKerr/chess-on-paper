import { PIECE_SVG } from "../lib/pieces";
import { setupWarnings } from "../lib/setup";

const PIECE_NAMES: Record<string, string> = {
  K: "king",
  Q: "queen",
  R: "rook",
  B: "bishop",
  N: "knight",
  P: "pawn",
};

interface Props {
  fen: string;
  /** The piece clicks will place; null erases */
  piece: string | null;
  onPiece: (piece: string | null) => void;
  onTurn: (turn: "w" | "b") => void;
  onPreset: (preset: "start" | "empty") => void;
  onUndo: (() => void) | null;
  hasMoves: boolean;
}

export function PieceIcon({ piece }: { piece: string }) {
  return (
    <svg viewBox="0 0 45 45" width="30" height="30" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: PIECE_SVG[piece] }} />
    </svg>
  );
}

/** Tools for placing pieces by hand, e.g. to copy a diagram from a book. */
export function SetupPanel({ fen, piece, onPiece, onTurn, onPreset, onUndo, hasMoves }: Props) {
  const turn = fen.split(" ")[1] === "b" ? "b" : "w";
  const warnings = setupWarnings(fen);
  return (
    <div className="setup" aria-label="Set up position">
      <div className="palette" role="radiogroup" aria-label="Piece to place">
        {["KQRBNP", "kqrbnp"].map((row) => (
          <div className="palette-row" key={row}>
            {[...row].map((p) => {
              const name = `${p === p.toUpperCase() ? "White" : "Black"} ${PIECE_NAMES[p.toUpperCase()]}`;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={piece === p}
                  aria-label={name}
                  title={name}
                  className={`palette-piece ${piece === p ? "on" : ""}`}
                  onClick={() => onPiece(p)}
                >
                  <PieceIcon piece={p} />
                </button>
              );
            })}
          </div>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={piece === null}
          className={`palette-piece eraser ${piece === null ? "on" : ""}`}
          onClick={() => onPiece(null)}
        >
          Erase
        </button>
      </div>
      <div className="setup-row">
        <div className="segmented" role="radiogroup" aria-label="Side to move">
          {(["w", "b"] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={turn === t} className={turn === t ? "on" : ""} onClick={() => onTurn(t)}>
              {t === "w" ? "White" : "Black"} to move
            </button>
          ))}
        </div>
        <span className="toolbar-spacer" />
        <button type="button" className="btn small ghost" onClick={() => onPreset("start")}>
          Start position
        </button>
        <button type="button" className="btn small ghost" onClick={() => onPreset("empty")}>
          Empty board
        </button>
        <button type="button" className="btn small" disabled={!onUndo} onClick={() => onUndo?.()}>
          Undo
        </button>
      </div>
      {hasMoves && <p className="hint">Changing the setup replaces the moves with this position.</p>}
      {warnings.map((w) => (
        <p key={w} className="hint warn-text">
          {w}
        </p>
      ))}
    </div>
  );
}
