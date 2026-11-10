import type { Square } from "chess.js";
import { EMPTY_FEN, fenAt, parseNotation, sideToMove, type ParsedNotation } from "./notation";
import type { Diagram } from "./sheet";

export interface DiagramView {
  parsed: ParsedNotation;
  /** The ply on show, clamped to the moves that parsed */
  ply: number;
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  /** e.g. "After 3...a6", or "" at the start position */
  after: string;
  toMove: "white" | "black";
}

const cache = new Map<string, ParsedNotation>();

/** Parsing is cheap but runs for every thumbnail and print board on each render. */
function parseCached(notation: string): ParsedNotation {
  let parsed = cache.get(notation);
  if (!parsed) {
    parsed = parseNotation(notation);
    if (cache.size > 200) cache.clear();
    cache.set(notation, parsed);
  }
  return parsed;
}

export function diagramView(d: Diagram): DiagramView {
  if (d.kind === "blank") {
    const parsed = { startFen: EMPTY_FEN, plies: [], problem: null, headers: {} };
    return { parsed, ply: 0, fen: EMPTY_FEN, lastMove: null, after: "", toMove: "white" };
  }
  const parsed = parseCached(d.notation);
  const ply = d.ply === null ? parsed.plies.length : Math.min(d.ply, parsed.plies.length);
  const fen = fenAt(parsed, ply);
  const last = ply > 0 ? parsed.plies[ply - 1] : null;
  return {
    parsed,
    ply,
    fen,
    lastMove: last ? { from: last.from, to: last.to } : null,
    after: last ? `After ${last.label}${last.label.endsWith("...") ? "" : " "}${last.san}` : "",
    toMove: sideToMove(fen),
  };
}

/** A short name for a diagram in lists: its caption, else its moves, else a fallback. */
export function diagramTitle(d: Diagram, index: number): string {
  if (d.caption.trim()) return d.caption.trim().split("\n")[0];
  if (d.kind === "blank") return `Blank board ${index + 1}`;
  const view = diagramView(d);
  if (view.after) return view.after;
  return view.parsed.startFen.startsWith("rnbqkbnr/pppppppp") ? "Starting position" : "Position";
}
