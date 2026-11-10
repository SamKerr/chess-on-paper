/**
 * Where a game swung: moves that cost the player a real share of their winning chances.
 * Measured in winning chances rather than pawns, so +5 -> +7 is nothing and
 * +0.3 -> -1.5 is a lot.
 */
import type { Score } from "./evaluation";
import type { ParsedNotation } from "./notation";
import { newDiagram, type Diagram } from "./sheet";

/** Expected score (0..1) for White from an engine score, on lichess's curve. */
export function whiteChances(score: Score): number {
  if (score.mate !== undefined) return score.mate > 0 ? 1 : 0;
  const cp = Math.max(-1000, Math.min(1000, score.cp ?? 0));
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

export type Severity = "inaccuracy" | "mistake" | "blunder";

/** Chances lost by the player who moved. Thresholds follow lichess's (0.1 / 0.2 / 0.3 of 1). */
export function severity(lost: number): Severity | null {
  if (lost >= 0.3) return "blunder";
  if (lost >= 0.2) return "mistake";
  if (lost >= 0.1) return "inaccuracy";
  return null;
}

export interface TurningPoint {
  /** Index of the move in parsed.plies; the position before it is ply `index` */
  index: number;
  label: string;
  san: string;
  severity: Severity;
  /** The mover's chances before and after, 0..1 */
  before: number;
  after: number;
  /** The engine's preferred move in the position before, if it differs */
  better: string | null;
}

/**
 * `scores[i]` is the engine's score (White's view) for the position after i half-moves,
 * so scores[0] is the start. `best[i]` is the engine's move in that position (SAN).
 */
export function findTurningPoints(
  parsed: ParsedNotation,
  scores: Score[],
  best: (string | null)[],
  minimum: Severity = "mistake",
): TurningPoint[] {
  const rank: Record<Severity, number> = { inaccuracy: 0, mistake: 1, blunder: 2 };
  const out: TurningPoint[] = [];
  parsed.plies.forEach((p, i) => {
    if (scores[i] === undefined || scores[i + 1] === undefined) return;
    const white = !p.label.endsWith("...");
    const before = white ? whiteChances(scores[i]) : 1 - whiteChances(scores[i]);
    const after = white ? whiteChances(scores[i + 1]) : 1 - whiteChances(scores[i + 1]);
    const s = severity(before - after);
    if (!s || rank[s] < rank[minimum]) return;
    out.push({
      index: i,
      label: p.label,
      san: p.san,
      severity: s,
      before,
      after,
      better: best[i] && best[i] !== p.san ? best[i] : null,
    });
  });
  return out;
}

/**
 * Diagrams of the positions before each mistake, to think about on paper. The caption
 * names the move played, not the engine's answer: the paper stays engine-free.
 */
export function mistakeDiagrams(notation: string, points: TurningPoint[]): Diagram[] {
  return points.map((p) =>
    newDiagram({
      notation,
      ply: p.index,
      flipped: p.label.endsWith("..."),
      caption: `${p.label}${p.san}${p.severity === "blunder" ? "??" : "?"} was played. What’s better, and why?`,
    }),
  );
}
