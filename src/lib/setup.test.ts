import { parseNotation, START_FEN } from "./notation";
import { inferCastling, movePiece, placePiece, setTurn, setupWarnings } from "./setup";
import { piecesFromFen } from "./geometry";

describe("setup", () => {
  it("places, replaces and removes pieces", () => {
    const empty = "8/8/8/8/8/8/8/8 w - - 0 1";
    const one = placePiece(empty, "e4", "N");
    expect(one).toBe("8/8/8/8/4N3/8/8/8 w - - 0 1");
    expect(placePiece(one, "e4", "q")).toBe("8/8/8/8/4q3/8/8/8 w - - 0 1");
    expect(placePiece(one, "e4", "N")).toBe(empty);
    expect(placePiece(one, "e4", null)).toBe(empty);
  });

  it("refuses pawns on the first and last ranks", () => {
    const empty = "8/8/8/8/8/8/8/8 w - - 0 1";
    expect(placePiece(empty, "a8", "P")).toBe(empty);
    expect(placePiece(empty, "h1", "p")).toBe(empty);
    const pawn = placePiece(empty, "a7", "P");
    expect(movePiece(pawn, "a7", "a8")).toBe(pawn);
  });

  it("moves pieces and keeps the side to move", () => {
    const fen = setTurn(START_FEN, "b");
    const moved = movePiece(fen, "g1", "f3");
    expect(piecesFromFen(moved).get("f3")).toBe("N");
    expect(moved.split(" ")[1]).toBe("b");
    expect(movePiece(fen, "e4", "e5")).toBe(fen);
  });

  it("infers castling rights from where kings and rooks stand", () => {
    expect(inferCastling(piecesFromFen(START_FEN))).toBe("KQkq");
    expect(inferCastling(piecesFromFen(movePiece(START_FEN, "h1", "h3")))).toBe("Qkq");
    expect(inferCastling(piecesFromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1"))).toBe("-");
  });

  it("produces FENs the notation parser accepts and can play from", () => {
    let fen = "8/8/8/8/8/8/8/8 w - - 0 1";
    fen = placePiece(fen, "e1", "K");
    fen = placePiece(fen, "e8", "k");
    fen = placePiece(fen, "e2", "P");
    expect(setupWarnings(fen)).toEqual([]);
    const parsed = parseNotation(`${fen} 1.e4`);
    expect(parsed.problem).toBeNull();
    expect(parsed.plies[0].san).toBe("e4");
  });

  it("warns when moves can't be played", () => {
    expect(setupWarnings("8/8/8/8/8/8/8/8 w - - 0 1")[0]).toMatch(/one king/);
  });
});
