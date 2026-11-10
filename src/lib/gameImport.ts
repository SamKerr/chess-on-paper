/** Turn a pasted game into a set of diagrams at the moments worth writing about. */
import { parseNotation, START_FEN, type ParsedNotation } from "./notation";
import { newDiagram, type Diagram } from "./sheet";

export type PickMode =
  | { kind: "every"; moves: number }
  | { kind: "list"; text: string }
  | { kind: "annotated" };

/**
 * Which plies to diagram (a ply count, i.e. the position after that many half-moves).
 * "every": after Black's Nth, 2Nth... move. "list": "12" is after White's 12th move,
 * "12..." after Black's. "annotated": moves with a glyph, NAG or comment.
 */
export function pickPlies(parsed: ParsedNotation, mode: PickMode): number[] {
  const total = parsed.plies.length;
  if (total === 0) return [];
  if (mode.kind === "annotated") {
    return parsed.plies.flatMap((p, i) => (p.annotated ? [i + 1] : []));
  }
  if (mode.kind === "every") {
    const n = Math.max(1, Math.floor(mode.moves));
    const out: number[] = [];
    // Find each ply whose label is the Black move of a multiple of n (works from any FEN).
    parsed.plies.forEach((p, i) => {
      const number = parseInt(p.label, 10);
      if (p.label.endsWith("...") && number % n === 0) out.push(i + 1);
    });
    if (out[out.length - 1] !== total) out.push(total);
    return out;
  }
  const wanted = new Set<string>();
  for (const m of mode.text.matchAll(/(\d+)\s*(\.\.\.|…)?/g)) {
    wanted.add(`${Number(m[1])}${m[2] ? "..." : "."}`);
  }
  return parsed.plies.flatMap((p, i) => (wanted.has(p.label) ? [i + 1] : []));
}

/** The main line as clean numbered SAN, prefixed by its FEN if it isn't the initial position. */
export function mainLine(parsed: ParsedNotation): string {
  const parts: string[] = [];
  parsed.plies.forEach((p, i) => {
    if (p.label.endsWith("...")) parts.push(i === 0 ? `${p.label} ${p.san}` : p.san);
    else parts.push(`${p.label}${p.san}`);
  });
  const moves = parts.join(" ");
  if (parsed.startFen === START_FEN) return moves;
  return moves ? `${parsed.startFen}\n${moves}` : parsed.startFen;
}

/** The main line up to a ply, ready to use as a new diagram's notation. */
export function lineUpTo(parsed: ParsedNotation, ply: number): string {
  return mainLine({ ...parsed, plies: parsed.plies.slice(0, Math.max(0, ply)) });
}

/** "Carlsen – Nepomniachtchi, World Championship 2021" from whatever headers exist. */
export function gameTitle(headers: Record<string, string>): string {
  const known = (v?: string) => (v && v !== "?" && !/^\?+$/.test(v) ? v : "");
  const players = [known(headers.White), known(headers.Black)].filter(Boolean).join(" – ");
  const year = /^\d{4}/.exec(headers.Date ?? "")?.[0] ?? "";
  const event = [known(headers.Event), year].filter(Boolean).join(" ");
  return [players, event].filter(Boolean).join(", ");
}

export interface ImportResult {
  parsed: ParsedNotation;
  plies: number[];
  title: string;
  diagrams: Diagram[];
}

export function importGame(pgn: string, mode: PickMode, flipped: boolean): ImportResult {
  const parsed = parseNotation(pgn);
  const plies = pickPlies(parsed, mode);
  // Keep the game as written: the annotator's symbols, comments and stored engine scores
  // are what the on-screen evaluation panel draws on.
  const notation = pgn.trim();
  return {
    parsed,
    plies,
    title: gameTitle(parsed.headers),
    diagrams: plies.map((ply) =>
      newDiagram({
        notation,
        ply: ply === parsed.plies.length ? null : ply,
        caption: parsed.plies[ply - 1]?.comment ?? "",
        flipped,
      }),
    ),
  };
}
