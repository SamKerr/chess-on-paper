import { arrowPolygon, piecesFromFen, SQ, squareAt, squareCenter, squareOrigin } from "./geometry";
import { START_FEN } from "./notation";
import {
  forgetSavedSheet,
  hasContent,
  moveItem,
  newDiagram,
  newSheet,
  pageCount,
  toggleArrow,
  toggleCircle,
  type Arrow,
} from "./sheet";
import { diagramTitle, diagramView } from "./view";

describe("toggleArrow / toggleCircle", () => {
  const a: Arrow = { from: "e2", to: "e4", color: "green" };

  it("adds, recolours, then removes", () => {
    const added = toggleArrow([], a);
    expect(added).toEqual([a]);
    const recoloured = toggleArrow(added, { ...a, color: "red" });
    expect(recoloured).toEqual([{ ...a, color: "red" }]);
    expect(toggleArrow(recoloured, { ...a, color: "red" })).toEqual([]);
  });

  it("treats reversed arrows as different", () => {
    expect(toggleArrow([a], { from: "e4", to: "e2", color: "green" })).toHaveLength(2);
  });

  it("toggles circles by square", () => {
    const one = toggleCircle([], { square: "f7", color: "red" });
    expect(toggleCircle(one, { square: "f7", color: "blue" })).toEqual([{ square: "f7", color: "blue" }]);
    expect(toggleCircle(one, { square: "f7", color: "red" })).toEqual([]);
  });
});

describe("moveItem", () => {
  it("moves within bounds and ignores moves past the ends", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
    const same = [1, 2, 3];
    expect(moveItem(same, 0, -1)).toBe(same);
    expect(moveItem(same, 2, 3)).toBe(same);
  });
});

describe("hasContent", () => {
  it("is false for a fresh sheet and true once anything is added", () => {
    expect(hasContent(newSheet())).toBe(false);
    const withMoves = newSheet();
    withMoves.diagrams[0].notation = "1.e4";
    expect(hasContent(withMoves)).toBe(true);
    const withTitle = { ...newSheet(), title: "Endgames" };
    expect(hasContent(withTitle)).toBe(true);
    const withBlank = { ...newSheet(), diagrams: [newDiagram({ kind: "blank" })] };
    expect(hasContent(withBlank)).toBe(true);
    const withMark = newSheet();
    withMark.diagrams[0].circles = [{ square: "f7", color: "red" }];
    expect(hasContent(withMark)).toBe(true);
  });
});

describe("forgetSavedSheet", () => {
  it("removes what earlier versions saved, and nothing else", () => {
    localStorage.setItem("chess-diagrams:sheet", "{}");
    localStorage.setItem("other-app", "keep");
    forgetSavedSheet();
    expect(localStorage.getItem("chess-diagrams:sheet")).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
  });
});

describe("geometry", () => {
  it("maps squares to positions in both orientations", () => {
    expect(squareOrigin("a8", false)).toEqual({ x: 0, y: 0 });
    expect(squareOrigin("h1", false)).toEqual({ x: 7 * SQ, y: 7 * SQ });
    expect(squareOrigin("a8", true)).toEqual({ x: 7 * SQ, y: 7 * SQ });
    expect(squareOrigin("e4", true)).toEqual({ x: 3 * SQ, y: 3 * SQ });
  });

  it("maps points back to squares", () => {
    for (const flipped of [false, true]) {
      for (const sq of ["a1", "e4", "h8", "c7"] as const) {
        expect(squareAt(squareCenter(sq, flipped), flipped)).toBe(sq);
      }
    }
    expect(squareAt({ x: -1, y: 10 }, false)).toBeNull();
    expect(squareAt({ x: 10, y: 8 * SQ }, false)).toBeNull();
  });

  it("reads pieces from a FEN, including boards without kings", () => {
    const start = piecesFromFen(START_FEN);
    expect(start.size).toBe(32);
    expect(start.get("e1")).toBe("K");
    expect(start.get("d8")).toBe("q");
    expect([...piecesFromFen("8/8/8/3p4/8/8/8/8 w - - 0 1")]).toEqual([["d5", "p"]]);
  });

  it("builds an arrow that ends before the target centre", () => {
    const from = squareCenter("e2", false);
    const to = squareCenter("e4", false);
    const poly = arrowPolygon(from, to);
    expect(poly).toHaveLength(7);
    const tip = poly[3];
    expect(tip.x).toBeCloseTo(to.x);
    expect(tip.y).toBeGreaterThan(to.y);
    expect(arrowPolygon(from, from)).toEqual([]);
  });
});

describe("diagramView", () => {
  it("shows the last move by default and an earlier one when asked", () => {
    const d = newDiagram({ notation: "1.e4 e5 2.Nf3" });
    const end = diagramView(d);
    expect(end.ply).toBe(3);
    expect(end.after).toBe("After 2. Nf3");
    expect(end.toMove).toBe("black");
    expect(end.lastMove).toEqual({ from: "g1", to: "f3" });

    const earlier = diagramView({ ...d, ply: 2 });
    expect(earlier.after).toBe("After 1...e5");
    expect(diagramView({ ...d, ply: 0 }).lastMove).toBeNull();
  });

  it("clamps a ply past the end, e.g. after moves were deleted", () => {
    expect(diagramView(newDiagram({ notation: "1.e4", ply: 9 })).ply).toBe(1);
  });

  it("shows an empty board for blank diagrams", () => {
    const view = diagramView(newDiagram({ kind: "blank", notation: "1.e4" }));
    expect(view.fen.startsWith("8/8/8/8/8/8/8/8")).toBe(true);
    expect(view.after).toBe("");
  });
});

describe("diagramTitle", () => {
  it("prefers the caption's first line, then the moves", () => {
    expect(diagramTitle(newDiagram({ caption: "Key idea\nmore" }), 0)).toBe("Key idea");
    expect(diagramTitle(newDiagram({ notation: "1.d4" }), 0)).toBe("After 1. d4");
    expect(diagramTitle(newDiagram(), 0)).toBe("Starting position");
    expect(diagramTitle(newDiagram({ kind: "blank" }), 2)).toBe("Blank board 3");
  });
});

describe("pageCount", () => {
  it("fits 6 boards on a page, the default layout", () => {
    const sheet = newSheet();
    expect(sheet.settings.layout).toBe("grid");
    sheet.diagrams = Array.from({ length: 6 }, () => newDiagram());
    expect(pageCount(sheet)).toBe(1);
    sheet.diagrams.push(newDiagram());
    expect(pageCount(sheet)).toBe(2);
  });
});
