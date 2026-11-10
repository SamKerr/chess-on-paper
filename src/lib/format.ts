/** Writing moves for print. Render the results with MoveText to show figurines. */
import type { ParsedNotation } from "./notation";

/** How many half-moves of context to print before the diagram, at most. */
export const MOVES_CONTEXT = 24;
/** How many half-moves of a continuation to print, at most. */
export const CONTINUATION_LENGTH = 20;

/** Numbered SAN for plies [from, to), e.g. "2...Nc6 3.Bb5 a6". */
export function movesBetween(parsed: ParsedNotation, from: number, to: number): string {
  const parts: string[] = [];
  for (let i = from; i < to; i++) {
    const p = parsed.plies[i];
    if (p.label.endsWith("...")) parts.push(i === from ? `${p.label}${p.san}` : p.san);
    else parts.push(`${p.label}${p.san}`);
  }
  return parts.join(" ");
}

/**
 * The moves leading to a position, e.g. "1.e4 e5 2.Nf3". Long lines keep only the last
 * `limit` half-moves, prefixed with "…", because the latest moves matter most.
 */
export function movesUpTo(parsed: ParsedNotation, ply: number, limit = MOVES_CONTEXT): string {
  const end = Math.min(ply, parsed.plies.length);
  const start = Math.max(0, end - limit);
  return (start > 0 ? "… " : "") + movesBetween(parsed, start, end);
}

/** The moves after a position, cut to `limit` half-moves with a trailing "…". */
export function movesAfter(parsed: ParsedNotation, ply: number, limit = CONTINUATION_LENGTH): string {
  const start = Math.max(0, Math.min(ply, parsed.plies.length));
  const end = Math.min(parsed.plies.length, start + limit);
  return movesBetween(parsed, start, end) + (end < parsed.plies.length ? " …" : "");
}

/** Number a line of SAN moves played from a FEN: "14.Nf5 Bxf5 15.exf5", or "14...Bxf5 15.exf5". */
export function numberedLine(fen: string, sans: string[]): string {
  const fields = fen.split(" ");
  let number = Number(fields[5]) || 1;
  let white = fields[1] !== "b";
  return sans
    .map((san, i) => {
      const text = white ? `${number}.${san}` : i === 0 ? `${number}...${san}` : san;
      if (!white) number += 1;
      white = !white;
      return text;
    })
    .join(" ");
}
