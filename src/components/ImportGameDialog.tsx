import { useEffect, useId, useRef, useState } from "react";
import { importGame, type PickMode } from "../lib/gameImport";
import type { Diagram } from "../lib/sheet";

interface Props {
  onImport: (diagrams: Diagram[], title: string) => void;
  onClose: () => void;
}

type Kind = PickMode["kind"];

/** Paste a game, choose which positions to diagram, add them to the sheet. */
export function ImportGameDialog({ onImport, onClose }: Props) {
  const [pgn, setPgn] = useState("");
  const [kind, setKind] = useState<Kind>("every");
  const [every, setEvery] = useState(10);
  const [list, setList] = useState("");
  const [flipped, setFlipped] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const ids = { title: useId(), pgn: useId(), every: useId(), list: useId() };

  useEffect(() => {
    textRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mode: PickMode =
    kind === "every" ? { kind, moves: every } : kind === "list" ? { kind, text: list } : { kind };
  const result = pgn.trim() ? importGame(pgn, mode, flipped) : null;
  const total = result?.parsed.plies.length ?? 0;
  const count = result?.diagrams.length ?? 0;
  const annotatedCount = result?.parsed.plies.filter((p) => p.annotated).length ?? 0;

  let summary = "Paste a game to see how many diagrams it makes.";
  if (result?.parsed.problem) summary = `Can't read the game: ${result.parsed.problem.message}`;
  else if (result && total === 0) summary = "No moves found in that text.";
  else if (result) {
    summary = `${total} ${total === 1 ? "move" : "moves"} read. Adds ${count} ${count === 1 ? "diagram" : "diagrams"}`;
    summary += count > 0 ? ` (after ${result.diagrams.map((_, i) => labelFor(result, i)).join(", ")}).` : ".";
  }
  const canImport = Boolean(result && !result.parsed.problem && count > 0);

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={ids.title}>
        <h2 id={ids.title}>Import a game</h2>
        <div className="field">
          <label htmlFor={ids.pgn}>PGN or moves</label>
          <textarea
            id={ids.pgn}
            ref={textRef}
            className="notation"
            rows={8}
            spellCheck={false}
            placeholder={'[White "You"]\n[Black "Opponent"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 {Open Sicilian} ...'}
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
          />
          <p className="hint">Headers, comments and variations are fine; diagrams follow the main line.</p>
        </div>

        <fieldset className="pick">
          <legend>Diagram these positions</legend>
          <label className="check">
            <input type="radio" name="pick" checked={kind === "every"} onChange={() => setKind("every")} />
            Every
            <input
              id={ids.every}
              aria-label="Moves between diagrams"
              type="number"
              min={1}
              max={99}
              className="num"
              value={every}
              onChange={(e) => setEvery(Math.max(1, Number(e.target.value) || 1))}
              onFocus={() => setKind("every")}
            />
            moves, and the final position
          </label>
          <label className="check">
            <input type="radio" name="pick" checked={kind === "list"} onChange={() => setKind("list")} />
            After moves
            <input
              id={ids.list}
              aria-label="Move numbers"
              className="text"
              placeholder="12, 18..., 24"
              value={list}
              onChange={(e) => setList(e.target.value)}
              onFocus={() => setKind("list")}
            />
          </label>
          <p className="hint indent">“12” is after White’s 12th move, “18...” after Black’s.</p>
          <label className="check">
            <input type="radio" name="pick" checked={kind === "annotated"} onChange={() => setKind("annotated")} />
            Moves marked with !, ?, $ or a comment{result ? ` (${annotatedCount})` : ""}
          </label>
        </fieldset>

        <label className="check">
          <input type="checkbox" checked={flipped} onChange={(e) => setFlipped(e.target.checked)} />
          Show from Black’s side
        </label>

        <p className={`import-summary ${result?.parsed.problem ? "warn-text" : ""}`} role="status">
          {summary}
        </p>

        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!canImport}
            onClick={() => result && onImport(result.diagrams, result.title)}
          >
            Add {count || ""} {count === 1 ? "diagram" : "diagrams"}
          </button>
        </div>
      </div>
    </div>
  );
}

function labelFor(result: NonNullable<ReturnType<typeof importGame>>, i: number): string {
  const d = result.diagrams[i];
  const ply = d.ply ?? result.parsed.plies.length;
  const p = result.parsed.plies[ply - 1];
  return p ? `${p.label}${p.san}` : "start";
}
