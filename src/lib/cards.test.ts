import { cardPageCount, sheetCards } from "./cards";
import { newDiagram, newSheet, pageCount } from "./sheet";

const LINE = "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7";

describe("flashcards", () => {
  it("makes a card per position, leaving out blank boards", () => {
    const sheet = newSheet();
    sheet.title = "Rook endings";
    sheet.settings.layout = "cards";
    sheet.diagrams = [
      newDiagram({ notation: LINE, ply: 4, caption: "Why the bishop?", arrows: [{ from: "b5", to: "c6", color: "red" }] }),
      newDiagram({ kind: "blank" }),
      newDiagram({ notation: LINE, caption: "The main line." }),
    ];
    const cards = sheetCards(sheet);
    expect(cards.map((c) => c.n)).toEqual([1, 3]);
    expect(cards[0]).toMatchObject({ idea: "Why the bishop?", moves: "3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7", marks: true });
    expect(cards[1]).toMatchObject({ idea: "The main line.", moves: "", marks: false });
    expect(cardPageCount(sheet)).toBe(1);
    expect(pageCount(sheet)).toBe(1);
  });

  it("counts four cards a page", () => {
    const sheet = newSheet();
    sheet.settings.layout = "cards";
    sheet.diagrams = Array.from({ length: 9 }, () => newDiagram({ notation: "1.e4" }));
    expect(pageCount(sheet)).toBe(3);
  });
});
