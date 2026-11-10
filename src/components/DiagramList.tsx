import type { Diagram, SheetSettings } from "../lib/sheet";
import { diagramTitle, diagramView } from "../lib/view";
import { Board } from "./Board";

interface Props {
  diagrams: Diagram[];
  selectedId: string | null;
  settings: SheetSettings;
  onSelect: (id: string) => void;
  onMove: (index: number, to: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
}

export function DiagramList({ diagrams, selectedId, settings, onSelect, onMove, onDuplicate, onDelete }: Props) {
  return (
    <ol className="diagram-list" aria-label="Diagrams on this sheet">
      {diagrams.map((d, i) => {
        const view = diagramView(d);
        const title = diagramTitle(d, i);
        const selected = d.id === selectedId;
        return (
          <li key={d.id} className={`diagram-item ${selected ? "on" : ""}`}>
            <button
              type="button"
              className="diagram-select"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(d.id)}
            >
              <Board
                className="thumb"
                fen={view.fen}
                flipped={d.flipped}
                coordinates={false}
                lastMove={settings.lastMove ? view.lastMove : null}
                arrows={d.arrows}
                circles={d.circles}
                showPieces={d.kind !== "blank"}
                label=""
              />
              <span className="diagram-meta">
                <span className="diagram-number">{i + 1}</span>
                <span className="diagram-title">{title}</span>
                {view.parsed.problem && <span className="badge warn">Check moves</span>}
              </span>
            </button>
            <div className="diagram-actions">
              <button type="button" className="icon-btn" aria-label={`Move ${title} up`} disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Move ${title} down`}
                disabled={i === diagrams.length - 1}
                onClick={() => onMove(i, i + 1)}
              >
                ↓
              </button>
              <button type="button" className="icon-btn" aria-label={`Duplicate ${title}`} onClick={() => onDuplicate(i)}>
                ⧉
              </button>
              <button type="button" className="icon-btn danger" aria-label={`Delete ${title}`} onClick={() => onDelete(i)}>
                ✕
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
