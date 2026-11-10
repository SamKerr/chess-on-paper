/** What goes on each side of a fold-over flashcard. */
import { movesAfter } from "./format";
import type { Diagram, Sheet } from "./sheet";
import { diagramView, type DiagramView } from "./view";

export const CARDS_PER_PAGE = 4;
/** Half-moves of continuation printed on the back of a card. */
const CARD_CONTINUATION = 8;

export interface Card {
  diagram: Diagram;
  n: number;
  /** Front: the position */
  view: DiagramView;
  /** Back */
  idea: string;
  moves: string;
  /** Show the marks on a board on the back */
  marks: boolean;
}

/** Blank boards have nothing to recall, so they don't become cards. */
export function sheetCards(sheet: Sheet): Card[] {
  return sheet.diagrams.flatMap((d, i) => {
    if (d.kind === "blank") return [];
    const view = diagramView(d);
    return [
      {
        diagram: d,
        n: i + 1,
        view,
        idea: d.caption,
        moves: movesAfter(view.parsed, view.ply, CARD_CONTINUATION),
        marks: d.arrows.length + d.circles.length > 0,
      },
    ];
  });
}

export function cardPageCount(sheet: Sheet): number {
  return Math.max(1, Math.ceil(sheetCards(sheet).length / CARDS_PER_PAGE));
}
