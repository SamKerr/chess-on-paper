import { CARDS_PER_PAGE, sheetCards, type Card } from "../lib/cards";
import type { Sheet } from "../lib/sheet";
import { Board } from "./Board";
import { MoveText } from "./MoveText";

/**
 * Fold-over flashcards: front on the left, back on the right. Cut along the solid lines,
 * fold along the dashed one; a vertical fold keeps both sides upright on any printer.
 */
export function CardSheet({ sheet }: { sheet: Sheet }) {
  const cards = sheetCards(sheet);
  const pages: Card[][] = [];
  for (let i = 0; i < cards.length; i += CARDS_PER_PAGE) pages.push(cards.slice(i, i + CARDS_PER_PAGE));
  if (pages.length === 0) pages.push([]);

  return (
    <div className="print-sheet layout-cards">
      {pages.map((page, p) => (
        <article className="page" key={p} aria-label={`Page ${p + 1} of ${pages.length}`}>
          <header className="cards-head">
            <span>✂ Cut along the solid lines, fold along the dashed line</span>
            <span>{pages.length > 1 ? `${p + 1} / ${pages.length}` : ""}</span>
          </header>
          <div className="cards">
            {page.length === 0 && <p className="cards-empty">Add positions to make cards. Blank boards are left out.</p>}
            {page.map((card) => (
              <FlashCard key={card.diagram.id} card={card} deck={sheet.title} figurines={sheet.settings.figurines} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function FlashCard({ card, deck, figurines }: { card: Card; deck: string; figurines: boolean }) {
  const { diagram: d, view } = card;
  return (
    <section className="card" aria-label={`Card ${card.n}`}>
      <div className="card-face card-front">
        <Board
          fen={view.fen}
          flipped={d.flipped}
          coordinates
          toMove
          lastMove={view.lastMove}
          label={`Card ${card.n}`}
        />
        <div className="card-front-text">
          <p className="card-meta">
            <span className="card-number">{card.n}</span>
            {deck && <span className="card-deck">{deck}</span>}
          </p>
          <p className="card-tomove">
            {view.toMove === "white" ? "White" : "Black"} to move
            {view.after && (
              <>
                {" after "}
                <MoveText text={view.after.replace(/^After\s+/, "")} figurines={figurines} />
              </>
            )}
          </p>
        </div>
      </div>
      <div className="card-face card-back">
        {card.moves && (
          <p className="card-moves">
            <MoveText text={card.moves} figurines={figurines} />
          </p>
        )}
        {card.idea && <p className="card-idea">{card.idea}</p>}
        {card.marks && (
          <Board
            className="card-back-board"
            fen={view.fen}
            flipped={d.flipped}
            coordinates={false}
            arrows={d.arrows}
            circles={d.circles}
            label={`Card ${card.n} marks`}
          />
        )}
        {!card.moves && !card.idea && !card.marks && (
          <p className="card-empty-back">Write the idea here.</p>
        )}
      </div>
    </section>
  );
}
