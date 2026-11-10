/**
 * The human evaluation scale used in annotated games, from White's point of view.
 * "unclear" (∞) sits outside the scale: it isn't more or less than equal.
 */
export const VERDICTS = ["+-", "+/-", "+=", "=", "=+", "-/+", "-+", "unclear"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_SYMBOL: Record<Verdict, string> = {
  "+-": "+−",
  "+/-": "±",
  "+=": "⩲",
  "=": "=",
  "=+": "⩱",
  "-/+": "∓",
  "-+": "−+",
  unclear: "∞",
};

export const VERDICT_WORDS: Record<Verdict, string> = {
  "+-": "White is winning",
  "+/-": "White is clearly better",
  "+=": "White is slightly better",
  "=": "Equal",
  "=+": "Black is slightly better",
  "-/+": "Black is clearly better",
  "-+": "Black is winning",
  unclear: "Unclear",
};

/** PGN NAGs for evaluations ($10 and $11 both mean equal; $12 is "equal, quiet"). */
const NAG_VERDICT: Record<number, Verdict> = {
  10: "=",
  11: "=",
  12: "=",
  13: "unclear",
  14: "+=",
  15: "=+",
  16: "+/-",
  17: "-/+",
  18: "+-",
  19: "-+",
  20: "+-",
  21: "-+",
};

export function verdictFromNag(nag: number): Verdict | null {
  return NAG_VERDICT[nag] ?? null;
}

/** Written evaluation symbols, as glyphs or in ASCII, longest first so "+/-" beats "+". */
const WRITTEN: [string, Verdict][] = [
  ["+/-", "+/-"],
  ["-/+", "-/+"],
  ["+/=", "+="],
  ["=/+", "=+"],
  ["+−", "+-"],
  ["−+", "-+"],
  ["+-", "+-"],
  ["-+", "-+"],
  ["+=", "+="],
  ["=+", "=+"],
  ["±", "+/-"],
  ["∓", "-/+"],
  ["⩲", "+="],
  ["⩱", "=+"],
  ["∞", "unclear"],
  ["=", "="],
];

/**
 * Split a trailing written evaluation off a move token: "Nf3±" -> ["Nf3", "+/-"].
 * A bare "+" or "#" stays: they are check and mate. A pawn move to the last rank ending
 * in "=" is an unfinished promotion (e8=), not an evaluation.
 */
export function splitWrittenVerdict(token: string): [string, Verdict | null] {
  for (const [text, verdict] of WRITTEN) {
    if (token.length > text.length && token.endsWith(text)) {
      const rest = token.slice(0, -text.length);
      if (text === "=" && /^[a-h](x[a-h])?[18]$/.test(rest)) continue;
      return [rest, verdict];
    }
  }
  return [token, null];
}

/** A whole token that is only an evaluation, e.g. "±" or "+/-". */
export function verdictFromToken(token: string): Verdict | null {
  return WRITTEN.find(([text]) => text === token)?.[1] ?? null;
}

/** An engine score from White's point of view: centipawns, or mate in N (negative: Black mates). */
export interface Score {
  cp?: number;
  mate?: number;
}

/**
 * Engine score to the human scale. The thresholds are a common convention, not a law:
 * within 0.3 equal, to 0.9 slightly better, to 2.0 clearly better, beyond that winning.
 */
export function verdictFromScore(score: Score): Verdict {
  if (score.mate !== undefined) return score.mate > 0 ? "+-" : "-+";
  const cp = score.cp ?? 0;
  const a = Math.abs(cp);
  const side = cp > 0 ? 1 : -1;
  if (a <= 30) return "=";
  if (a <= 90) return side > 0 ? "+=" : "=+";
  if (a <= 200) return side > 0 ? "+/-" : "-/+";
  return side > 0 ? "+-" : "-+";
}

export function formatScore(score: Score): string {
  if (score.mate !== undefined) return score.mate > 0 ? `#${score.mate}` : `#−${Math.abs(score.mate)}`;
  // Round first, so a centipawn or two either way reads "0.0", not "−0.0".
  const pawns = Math.round((score.cp ?? 0) / 10) / 10;
  return `${pawns > 0 ? "+" : pawns < 0 ? "−" : ""}${Math.abs(pawns).toFixed(1)}`;
}

/** Read lichess's "[%eval 0.35]" or "[%eval #-3]" from a comment. */
export function scoreFromComment(comment: string): Score | null {
  const m = /\[%eval\s+(#?)(-?\d+(?:\.\d+)?)\]/.exec(comment);
  if (!m) return null;
  return m[1] ? { mate: Number(m[2]) } : { cp: Math.round(Number(m[2]) * 100) };
}

/** Remove "[%clk 0:03:00]"-style commands that lichess and ChessBase put in comments. */
export function stripCommands(comment: string): string {
  return comment.replace(/\[%[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

export type Closeness = "exact" | "close" | "off" | "wrong-side";

/** How a guess compares with the answer. One step along the scale counts as close. */
export function compareVerdicts(guess: Verdict, answer: Verdict): Closeness {
  if (guess === answer) return "exact";
  if (guess === "unclear" || answer === "unclear") return "off";
  const g = VERDICTS.indexOf(guess) - 3;
  const a = VERDICTS.indexOf(answer) - 3;
  if (Math.abs(g - a) === 1) return "close";
  if (g * a < 0) return "wrong-side";
  return "off";
}
