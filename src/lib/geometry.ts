/** Board geometry shared by the renderer and its tests. One square is 45 units. */
import type { Square } from "chess.js";

export const SQ = 45;
const FILES = "abcdefgh";

export interface Point {
  x: number;
  y: number;
}

/** Top-left corner of a square, relative to the board's top-left. */
export function squareOrigin(square: Square, flipped: boolean): Point {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  const col = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;
  return { x: col * SQ, y: row * SQ };
}

export function squareCenter(square: Square, flipped: boolean): Point {
  const { x, y } = squareOrigin(square, flipped);
  return { x: x + SQ / 2, y: y + SQ / 2 };
}

/** The square under a point in board units, or null when outside the board. */
export function squareAt(point: Point, flipped: boolean): Square | null {
  const col = Math.floor(point.x / SQ);
  const row = Math.floor(point.y / SQ);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  const file = flipped ? 7 - col : col;
  const rank = flipped ? row : 7 - row;
  return `${FILES[file]}${rank + 1}` as Square;
}

export function isLightSquare(square: Square): boolean {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return (file + rank) % 2 === 1;
}

export const ALL_SQUARES: Square[] = Array.from(
  { length: 64 },
  (_, i) => `${FILES[i % 8]}${Math.floor(i / 8) + 1}` as Square,
);

/** Piece letters by square from the placement field of a FEN. Tolerates kingless boards. */
export function piecesFromFen(fen: string): Map<Square, string> {
  const pieces = new Map<Square, string>();
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, r) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) file += Number(ch);
      else {
        if (file < 8 && r < 8) pieces.set(`${FILES[file]}${8 - r}` as Square, ch);
        file += 1;
      }
    }
  });
  return pieces;
}

/**
 * Outline of an arrow from one square's centre towards another's, as a polygon.
 * The head stops short of the centre so a piece on the target square stays visible.
 */
export function arrowPolygon(from: Point, to: Point): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return [];
  const ux = dx / len;
  const uy = dy / len;
  const shaft = SQ * 0.1; // half width
  const head = SQ * 0.28; // half width
  const headLen = SQ * 0.45;
  const tip = { x: to.x - ux * SQ * 0.18, y: to.y - uy * SQ * 0.18 };
  const start = { x: from.x + ux * SQ * 0.2, y: from.y + uy * SQ * 0.2 };
  const base = { x: tip.x - ux * headLen, y: tip.y - uy * headLen };
  const px = -uy;
  const py = ux;
  const at = (p: Point, w: number) => ({ x: p.x + px * w, y: p.y + py * w });
  return [at(start, shaft), at(base, shaft), at(base, head), tip, at(base, -head), at(base, -shaft), at(start, -shaft)];
}
