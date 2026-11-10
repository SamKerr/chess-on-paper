/** Editing a position piece by piece, e.g. to copy a diagram out of a book. */
import type { Square } from "chess.js";
import { piecesFromFen } from "./geometry";

const FILES = "abcdefgh";

export function placementFromPieces(pieces: Map<Square, string>): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let empty = 0;
    for (const file of FILES) {
      const piece = pieces.get(`${file}${rank}` as Square);
      if (piece) {
        if (empty) row += empty;
        row += piece;
        empty = 0;
      } else empty += 1;
    }
    rows.push(row + (empty ? empty : ""));
  }
  return rows.join("/");
}

/** Castling rights that the placement still allows: king and rook on their home squares. */
export function inferCastling(pieces: Map<Square, string>): string {
  let rights = "";
  if (pieces.get("e1") === "K") {
    if (pieces.get("h1") === "R") rights += "K";
    if (pieces.get("a1") === "R") rights += "Q";
  }
  if (pieces.get("e8") === "k") {
    if (pieces.get("h8") === "r") rights += "k";
    if (pieces.get("a8") === "r") rights += "q";
  }
  return rights || "-";
}

function build(pieces: Map<Square, string>, turn: "w" | "b"): string {
  return `${placementFromPieces(pieces)} ${turn} ${inferCastling(pieces)} - 0 1`;
}

function turnOf(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

/** Pawns can never stand on the first or last rank; FENs with them are invalid. */
function allowed(piece: string, square: Square): boolean {
  return !(piece.toLowerCase() === "p" && (square[1] === "1" || square[1] === "8"));
}

/**
 * Put `piece` on `square`, or clear it when `piece` is null. Placing the piece that is
 * already there removes it, so clicking twice undoes a click.
 */
export function placePiece(fen: string, square: Square, piece: string | null): string {
  const pieces = piecesFromFen(fen);
  if (piece === null || pieces.get(square) === piece) pieces.delete(square);
  else if (allowed(piece, square)) pieces.set(square, piece);
  else return fen;
  return build(pieces, turnOf(fen));
}

export function movePiece(fen: string, from: Square, to: Square): string {
  const pieces = piecesFromFen(fen);
  const piece = pieces.get(from);
  if (!piece || from === to || !allowed(piece, to)) return fen;
  pieces.delete(from);
  pieces.set(to, piece);
  return build(pieces, turnOf(fen));
}

export function setTurn(fen: string, turn: "w" | "b"): string {
  return build(piecesFromFen(fen), turn);
}

/** Problems that stop moves being played from the position (it can still be drawn). */
export function setupWarnings(fen: string): string[] {
  const pieces = [...piecesFromFen(fen)];
  const count = (p: string) => pieces.filter(([, x]) => x === p).length;
  const warnings: string[] = [];
  if (count("K") !== 1 || count("k") !== 1) {
    warnings.push("Each side needs exactly one king to play moves from here. It still prints fine.");
  }
  return warnings;
}
