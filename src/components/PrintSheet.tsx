import { movesUpTo } from "../lib/format";
import { pageCount, PER_PAGE, type Diagram, type Sheet } from "../lib/sheet";
import { diagramView } from "../lib/view";
import { Board } from "./Board";
import { CardSheet } from "./CardSheet";
import { MoveText } from "./MoveText";

/** More than fit; the slot clips them. Bordered spans print without "background graphics". */
const RULED_LINES = 24;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** The sheet as A4 pages: what gets printed, and what the preview shows. */
export function PrintSheet({ sheet }: { sheet: Sheet }) {
  const { settings } = sheet;
  if (settings.layout === "cards") return <CardSheet sheet={sheet} />;
  const perPage = PER_PAGE[settings.layout];
  const pages = chunk(sheet.diagrams, perPage);
  if (pages.length === 0) pages.push([]);
  const total = pageCount(sheet);

  return (
    <div className={`print-sheet layout-${settings.layout}`}>
      {pages.map((page, p) => (
        <article className="page" key={p} aria-label={`Page ${p + 1} of ${total}`}>
          <header className="page-head">
            <span className="page-title">{sheet.title}</span>
            <span className="page-meta">{total > 1 ? `${p + 1} / ${total}` : ""}</span>
          </header>
          <div className="page-body">
            {page.map((d, i) => (
              <Slot key={d.id} d={d} n={p * perPage + i + 1} sheet={sheet} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function Slot({ d, n, sheet }: { d: Diagram; n: number; sheet: Sheet }) {
  const { settings } = sheet;
  const view = diagramView(d);
  const blank = d.kind === "blank";
  return (
    <section className="slot">
      <figure className="slot-figure">
        <Board
          fen={view.fen}
          flipped={d.flipped}
          coordinates={settings.coordinates}
          toMove={settings.toMove && !blank}
          lastMove={settings.lastMove ? view.lastMove : null}
          arrows={d.arrows}
          circles={d.circles}
          showPieces={!blank}
          label={d.caption || `Diagram ${n}`}
        />
        <figcaption>
          <span className="slot-number">{n}</span>
          {!blank && view.after && (
            <span className="slot-after">
              <MoveText text={view.after} figurines={settings.figurines} />
            </span>
          )}
          {!blank && settings.toMove && (
            <span className="slot-tomove">{view.toMove === "white" ? "White" : "Black"} to move</span>
          )}
        </figcaption>
      </figure>
      <div className="slot-notes">
        {!blank && settings.showMoves && view.ply > 0 && (
          <p className="slot-moves">
            <MoveText text={movesUpTo(view.parsed, view.ply)} figurines={settings.figurines} />
          </p>
        )}
        {d.caption && <p className="slot-caption">{d.caption}</p>}
        {settings.ruledLines && (
          <div className="ruled" aria-hidden="true">
            {Array.from({ length: RULED_LINES }, (_, k) => (
              <span key={k} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
