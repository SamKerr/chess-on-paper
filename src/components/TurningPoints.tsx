import { validateFen } from "chess.js";
import { useContext, useEffect, useRef, useState } from "react";
import type { Score } from "../lib/evaluation";
import { fenAt, type ParsedNotation } from "../lib/notation";
import { findTurningPoints, type TurningPoint } from "../lib/turningPoints";
import { EngineContext } from "./EvalGuess";
import { MoveText } from "./MoveText";

/** Engine time per position when checking a whole game. */
const CHECK_MOVETIME = 300;

type State =
  | { status: "idle" }
  | { status: "running"; done: number }
  | { status: "done"; points: TurningPoint[] }
  | { status: "error"; message: string };

const pct = (x: number) => `${Math.round(x * 100)}%`;

interface Props {
  parsed: ParsedNotation;
  onSelect: (ply: number) => void;
  figurines: boolean;
  /** Add the positions before the mistakes to the sheet */
  onAdd: (points: TurningPoint[]) => void;
}

/**
 * After you've analysed a game yourself: the engine checks every move and lists where the
 * game swung. On screen only; nothing is kept.
 */
export function TurningPoints({ parsed, onSelect, figurines, onAdd }: Props) {
  const analyse = useContext(EngineContext);
  const [state, setState] = useState<State>({ status: "idle" });
  const run = useRef(0);
  const total = parsed.plies.length;
  const playable = validateFen(parsed.startFen).ok;

  useEffect(
    () => () => {
      run.current += 1; // stop any check in progress when the game changes or we unmount
    },
    [],
  );

  const check = async () => {
    const id = ++run.current;
    setState({ status: "running", done: 0 });
    const scores: Score[] = [];
    const best: (string | null)[] = [];
    try {
      for (let i = 0; i <= total; i++) {
        const analysis = await analyse(fenAt(parsed, i), CHECK_MOVETIME);
        if (run.current !== id) return;
        scores.push(analysis.score);
        best.push(analysis.line[0] ?? null);
        setState({ status: "running", done: i + 1 });
      }
      setState({ status: "done", points: findTurningPoints(parsed, scores, best) });
    } catch (e) {
      if (run.current === id) setState({ status: "error", message: e instanceof Error ? e.message : "The engine failed." });
    }
  };

  if (total < 2 || !playable) return null;
  const seconds = Math.ceil(((total + 1) * CHECK_MOVETIME) / 1000);

  return (
    <section className="turning" aria-label="Turning points">
      <div className="eval-head">
        <span className="label">Turning points</span>
        {state.status === "running" ? (
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              run.current += 1;
              setState({ status: "idle" });
            }}
          >
            Cancel
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => void check()}>
            {state.status === "done" ? "Check again" : "Check the game with the engine"}
          </button>
        )}
      </div>
      {state.status === "idle" && (
        <p className="hint">
          Analyse the game yourself first. Then the engine checks every move (about {seconds} s) and lists where it swung.
        </p>
      )}
      {state.status === "running" && (
        <p className="hint" role="status">
          Checking position {state.done} of {total + 1}…
        </p>
      )}
      {state.status === "error" && <p className="hint warn-text">{state.message}</p>}
      {state.status === "done" &&
        (state.points.length === 0 ? (
          <p className="hint" role="status">
            No mistakes found: no move cost more than a fifth of the player’s winning chances.
          </p>
        ) : (
          <ol className="turning-list" role="status" aria-label="Mistakes">
            {state.points.map((p) => (
              <li key={p.index}>
                <button type="button" className="turning-item" onClick={() => onSelect(p.index)}>
                  <span className={`turning-sev ${p.severity}`}>{p.severity === "blunder" ? "??" : "?"}</span>
                  <span className="turning-move">
                    <MoveText text={`${p.label}${p.san}`} figurines={figurines} />
                  </span>
                  <span className="turning-detail">
                    {p.severity}: {pct(p.before)} → {pct(p.after)} of the points
                    {p.better && (
                      <>
                        {" · "}better <MoveText text={p.better} figurines={figurines} />
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ))}
      {state.status === "done" && state.points.length > 0 && (
        <button type="button" className="btn small ghost turning-add" onClick={() => onAdd(state.points)}>
          + Add {state.points.length === 1 ? "this position" : `these ${state.points.length} positions`} to the sheet
        </button>
      )}
    </section>
  );
}
