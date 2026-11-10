import type { ParsedNotation } from "../lib/notation";
import { MoveText } from "./MoveText";

interface Props {
  parsed: ParsedNotation;
  /** 0 is the start position */
  ply: number;
  onSelect: (ply: number) => void;
  figurines?: boolean;
  /** Training: hide the moves after the shown position so they can't give the answer away */
  hideAhead?: boolean;
  onHideAhead?: (hide: boolean) => void;
}

/** The parsed moves as buttons: pick which position the diagram shows. */
export function MoveList({ parsed, ply, onSelect, figurines = false, hideAhead = false, onHideAhead }: Props) {
  const total = parsed.plies.length;
  const shown = hideAhead ? parsed.plies.slice(0, ply) : parsed.plies;
  return (
    <div className="field">
      <div className="movelist-head">
        <span className="label" id="moves-label">
          Diagram shows
        </span>
        <div className="stepper">
          <button type="button" className="btn small ghost" aria-label="First position" disabled={ply === 0} onClick={() => onSelect(0)}>
            ⏮
          </button>
          <button type="button" className="btn small ghost" aria-label="Previous move" disabled={ply === 0} onClick={() => onSelect(ply - 1)}>
            ◀
          </button>
          <button type="button" className="btn small ghost" aria-label="Next move" disabled={ply === total} onClick={() => onSelect(ply + 1)}>
            ▶
          </button>
          <button type="button" className="btn small ghost" aria-label="Last move" disabled={ply === total} onClick={() => onSelect(total)}>
            ⏭
          </button>
        </div>
      </div>
      <ol className="movelist" aria-labelledby="moves-label">
        <li>
          <button type="button" className={`move start ${ply === 0 ? "on" : ""}`} aria-current={ply === 0 ? "step" : undefined} onClick={() => onSelect(0)}>
            Start
          </button>
        </li>
        {shown.map((p, i) => {
          const showNumber = p.label.endsWith(".") && (!p.label.endsWith("...") || i === 0);
          return (
            <li key={i}>
              {showNumber && <span className="move-number">{p.label}</span>}
              <button
                type="button"
                className={`move ${ply === i + 1 ? "on" : ""}`}
                aria-current={ply === i + 1 ? "step" : undefined}
                aria-label={`${p.label} ${p.san}`}
                onClick={() => onSelect(i + 1)}
              >
                <MoveText text={p.san} figurines={figurines} />
              </button>
            </li>
          );
        })}
        {hideAhead && ply < total && (
          <li className="move-hidden">
            … {total - ply} more {total - ply === 1 ? "move" : "moves"} hidden
          </li>
        )}
      </ol>
      <div className="movelist-foot">
        <p className="hint">Use ← and → to step through moves.</p>
        {onHideAhead && (
          <label className="check small-check">
            <input type="checkbox" checked={hideAhead} onChange={(e) => onHideAhead(e.target.checked)} />
            Hide what comes next
          </label>
        )}
      </div>
    </div>
  );
}
