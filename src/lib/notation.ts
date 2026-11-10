/**
 * Turn notation as people write it into a sequence of positions.
 *
 * Input is any of: empty or "start" (initial position), a FEN, moves in SAN
 * ("1.e4 e5 2.Nf3"), or a FEN followed by moves played from it.
 *
 * It is forgiving about handwriting conventions: 0-0, "!?" style glyphs,
 * {comments}, ;line comments, $NAGs, "x" or ":" for captures, "1..." for a Black
 * move, lower-case piece letters ("nf3"), and a trailing result. Move numbers, when
 * written, must match the position: a wrong number nearly always means a move was dropped
 * while copying.
 *
 * Whole PGN games paste in too: [Tag "headers"] are read (a [FEN] tag sets the start)
 * and (variations), however deeply nested, are skipped so the main line remains.
 *
 * A link that carries a position works as a FEN: lichess analysis and editor links
 * (lichess.org/analysis/<fen>), or any URL with a ?fen= parameter.
 *
 * Parsing never throws. It returns every move up to the first problem and
 * describes the problem with its character range in the input.
 */
import { Chess, type Move, type Square, validateFen } from "chess.js";
import {
  scoreFromComment,
  splitWrittenVerdict,
  stripCommands,
  verdictFromNag,
  verdictFromToken,
  type Score,
  type Verdict,
} from "./evaluation";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const EMPTY_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";

export interface Ply {
  san: string;
  /** "12." for White, "12..." for Black */
  label: string;
  from: Square;
  to: Square;
  /** Position after this move */
  fen: string;
  /** Marked as a key moment: a !/? glyph, a $NAG, or a comment after it */
  annotated: boolean;
  /** The comment written after this move, if any */
  comment?: string;
  /** The annotator's evaluation of the position after this move (a glyph or NAG) */
  verdict?: Verdict;
  /** An engine score stored in the game, e.g. lichess's [%eval 0.35] */
  score?: Score;
}

export interface NotationProblem {
  message: string;
  /** Character range of the offending token in the input */
  start: number;
  end: number;
  /** Legal moves that might have been meant */
  suggestions: string[];
}

export interface ParsedNotation {
  startFen: string;
  plies: Ply[];
  problem: NotationProblem | null;
  /** PGN tag pairs, e.g. { White: "Carlsen", Black: "Nepo" } */
  headers: Record<string, string>;
}

const RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "½-½", "*"]);
const MOVE_NUMBER = /^(\d+)(\.\.\.|…|\.)(.*)$/;
const TRAILING_GLYPHS = /[!?+#=±∓⩲⩱∞]+$/;
const DEST_SQUARE = /([a-h][1-8])(?:=?[QRBNqrbn])?$/;
const FEN_DEFAULTS = ["w", "-", "-", "0", "1"];

interface Token {
  text: string;
  start: number;
  /** Comments are kept (main line only) so they can be attached to the move before them */
  comment?: boolean;
}

/**
 * Split into whitespace tokens with offsets. Comments become single comment tokens;
 * [Tag "value"] headers and (variations) are dropped.
 */
function tokenize(input: string): { tokens: Token[]; headers: Record<string, string> } {
  const tokens: Token[] = [];
  const headers: Record<string, string> = {};
  let depth = 0;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "{" || ch === ";") {
      const close = ch === "{" ? input.indexOf("}", i + 1) : input.indexOf("\n", i + 1);
      const end = close === -1 ? input.length : close + (ch === "{" ? 1 : 0);
      if (depth === 0) {
        const text = input.slice(i + 1, ch === "{" && close !== -1 ? close : end).trim();
        if (text) tokens.push({ text, start: i, comment: true });
      }
      i = end;
    } else if (ch === "[" && depth === 0) {
      const close = input.indexOf("]", i + 1);
      const end = close === -1 ? input.length : close + 1;
      const tag = /^\[\s*(\w+)\s+"((?:[^"\\]|\\.)*)"\s*\]$/.exec(input.slice(i, end));
      if (tag) headers[tag[1]] = tag[2].replace(/\\(.)/g, "$1");
      i = end;
    } else if (ch === "(") {
      depth += 1;
      i += 1;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
      i += 1;
    } else if (/\s/.test(ch)) {
      i += 1;
    } else {
      const m = /[^\s{};()[\]]+/y;
      m.lastIndex = i;
      const word = m.exec(input)![0];
      if (depth === 0) tokens.push({ text: word, start: i });
      i += word.length;
    }
  }
  return { tokens, headers };
}

/** A FEN that sets up a board, though not necessarily a playable one. */
function tryFen(fields: string[]): { game: Chess; playable: boolean } | null {
  const fen = [...fields, ...FEN_DEFAULTS.slice(fields.length - 1)].join(" ");
  const check = validateFen(fen);
  if (check.ok) return { game: new Chess(fen), playable: true };
  // Positions without both kings (pawn structures, piece placement ideas) are
  // still worth drawing; chess.js just cannot play moves from them.
  if (!/king/i.test(check.error ?? "")) return null;
  try {
    return { game: new Chess(fen, { skipValidation: true }), playable: false };
  } catch {
    return null;
  }
}

function label(game: Chess): string {
  return game.turn() === "w" ? `${game.moveNumber()}.` : `${game.moveNumber()}...`;
}

/** Normalise one handwritten move token into something chess.js accepts. */
export function cleanMove(token: string): string {
  return token
    .replace(/0-0-0|O-O-O|o-o-o/g, "O-O-O")
    .replace(/0-0|o-o/g, "O-O")
    .replace(/[×:]/g, "x")
    .replace(/(?<=[a-h][1-8])e\.?p\.?$/, "")
    .replace(TRAILING_GLYPHS, "")
    .replace(/[+#]+$/, "");
}

/**
 * A move typed without regard to case ("nf3", "qxd5", "e8=q"). Only tried once the text
 * as written isn't a move, so "bxc3" stays the b-pawn's capture whenever that is legal.
 * A capital B always means a bishop: "Bxc3" is never read as the pawn's capture.
 */
function looseMove(game: Chess, token: string): string | null {
  const want = token.toLowerCase();
  const matches = game
    .moves()
    .filter((san) => san.replace(/[+#]+$/, "").toLowerCase() === want)
    .filter((san) => !(token.startsWith("B") && san.startsWith("b")));
  return matches.length === 1 ? matches[0] : null;
}

/** Play the move as written, or failing that as typed without regard to case. Throws if neither is legal. */
function play(game: Chess, token: string): Move {
  try {
    return game.move(token);
  } catch (error) {
    const loose = looseMove(game, token);
    if (!loose) throw error;
    return game.move(loose);
  }
}

function candidates(game: Chess, token: string): Move[] {
  const dest = DEST_SQUARE.exec(token)?.[1];
  if (!dest) return [];
  const all = game.moves({ verbose: true }).filter((m) => m.to === dest);
  // A lower-case "b" is left out: it is far more often the b-file.
  const piece = /^[KQRBNkqrn]/.exec(token)?.[0]?.toLowerCase() ?? (token.startsWith("O") ? "k" : "p");
  const samePiece = all.filter((m) => m.piece === piece);
  return samePiece.length > 0 ? samePiece : all;
}

/** The FEN inside a pasted link, or null. Underscores and + stand for spaces in such links. */
export function fenFromUrl(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, " ")).replace(/_/g, " ").trim();
    } catch {
      return null;
    }
  };
  const param = url.searchParams.get("fen");
  if (param) return param.replace(/_/g, " ").trim();
  const path = /^\/(?:analysis|editor)(?:\/(?:standard|fromPosition))?\/(.+)$/.exec(url.pathname);
  if (/(^|\.)lichess\.org$/.test(url.hostname) && path && path[1].includes("/")) return decode(path[1]);
  return null;
}

export function parseNotation(input: string): ParsedNotation {
  const { tokens, headers } = tokenize(input);
  const linked = tokens[0] && /^https?:\/\//.test(tokens[0].text) ? fenFromUrl(tokens[0].text) : null;
  if (linked) {
    // Expand the link into FEN fields that all point back at the link's characters.
    const first = tokens[0];
    tokens.splice(0, 1, ...linked.split(/\s+/).map((text) => ({ text, start: first.start })));
  } else if (tokens[0] && /^https?:\/\//.test(tokens[0].text)) {
    return {
      startFen: START_FEN,
      plies: [],
      headers,
      problem: {
        message:
          "This link doesn't contain a position. Use a lichess analysis or board editor link, " +
          "or copy the FEN or PGN instead.",
        start: tokens[0].start,
        end: tokens[0].start + tokens[0].text.length,
        suggestions: [],
      },
    };
  }
  let game = new Chess();
  let playable = true;
  let i = 0;

  if (headers.FEN && !tokens[0]?.text.includes("/")) {
    const fromTag = tryFen(headers.FEN.trim().split(/\s+/));
    if (fromTag) {
      game = fromTag.game;
      playable = fromTag.playable;
    }
  }

  if (tokens.length > 0 && tokens[0].text.toLowerCase() === "start") i = 1;
  else if (tokens.length > 0 && tokens[0].text.includes("/")) {
    let parsed: ReturnType<typeof tryFen> = null;
    for (let n = Math.min(6, tokens.length); n >= 1 && !parsed; n--) {
      parsed = tryFen(tokens.slice(0, n).map((t) => t.text));
      if (parsed) i = n;
    }
    if (!parsed) {
      const last = tokens[Math.min(5, tokens.length - 1)];
      return {
        startFen: START_FEN,
        plies: [],
        headers,
        problem: {
          message: "This doesn't look like a valid FEN position.",
          start: tokens[0].start,
          end: last.start + last.text.length,
          suggestions: [],
        },
      };
    }
    game = parsed.game;
    playable = parsed.playable;
  }

  const startFen = game.fen();
  const plies: Ply[] = [];
  const fail = (tok: Token, message: string, suggestions: string[] = []): ParsedNotation => ({
    startFen,
    plies,
    headers,
    problem: { message, start: tok.start, end: tok.start + tok.text.length, suggestions },
  });

  for (; i < tokens.length; i++) {
    const tok = tokens[i];
    let text = tok.text;
    const previous = plies[plies.length - 1];
    if (tok.comment) {
      if (previous) {
        const score = scoreFromComment(text);
        if (score) previous.score = score;
        // Clock times and other [%commands] aren't annotation.
        const words = stripCommands(text);
        if (words) {
          previous.annotated = true;
          previous.comment = previous.comment ? `${previous.comment} ${words}` : words;
        }
      }
      continue;
    }
    const nag = /^\$(\d+)$/.exec(text);
    const written = nag ? null : verdictFromToken(text);
    if (nag || written || /^[!?]+$/.test(text)) {
      if (previous) {
        previous.annotated = true;
        const verdict = nag ? verdictFromNag(Number(nag[1])) : written;
        if (verdict) previous.verdict = verdict;
      }
      continue;
    }
    if (RESULTS.has(text)) continue;

    const num = MOVE_NUMBER.exec(text);
    if (num) {
      const written = Number(num[1]);
      const black = num[2] !== ".";
      if (written !== game.moveNumber() || black !== (game.turn() === "b")) {
        return fail(
          tok,
          `Move number ${written}${black ? "..." : "."} is written here, but the next move is ` +
            `${label(game)}. A move may be missing or written twice.`,
        );
      }
      text = num[3];
      if (!text) continue;
    }

    if (!playable) {
      return fail(tok, "Moves can't be played from a position without both kings.");
    }
    const [moveText, verdict] = splitWrittenVerdict(text);
    const cleaned = cleanMove(moveText);
    const moveLabel = label(game);
    let move: Move;
    try {
      move = play(game, cleaned);
    } catch {
      const options = candidates(game, cleaned);
      const sans = options.map((m) => m.san).sort();
      if (game.isGameOver()) return fail(tok, `${moveLabel} ${text}: the game is already over.`);
      if (options.length > 1 && options.every((m) => m.piece === options[0].piece)) {
        return fail(
          tok,
          `${moveLabel} ${text} is ambiguous. Say which piece: ${sans.join(" or ")}.`,
          sans,
        );
      }
      const hint = sans.length > 0 ? ` Legal moves to that square: ${sans.join(", ")}.` : "";
      return fail(tok, `${moveLabel} ${text} is not legal here.${hint}`, sans);
    }
    plies.push({
      san: move.san,
      label: moveLabel,
      from: move.from,
      to: move.to,
      fen: game.fen(),
      annotated: /[!?]/.test(text) || verdict !== null,
      ...(verdict ? { verdict } : {}),
    });
  }

  return { startFen, plies, problem: null, headers };
}

/** FEN at a ply: 0 is the start position, plies.length the final one. */
export function fenAt(parsed: ParsedNotation, ply: number): string {
  if (ply <= 0 || parsed.plies.length === 0) return parsed.startFen;
  return parsed.plies[Math.min(ply, parsed.plies.length) - 1].fen;
}

/** Text to append to the notation so that `san` is played next. */
export function appendMove(notation: string, fenBefore: string, san: string): string {
  const game = new Chess(fenBefore);
  const trimmed = notation.trimEnd();
  const isFenOnly = trimmed.includes("/") && parseNotation(trimmed).plies.length === 0;
  const needsNumber =
    game.turn() === "w" || trimmed === "" || isFenOnly || /\}\s*$/.test(trimmed);
  const prefix = needsNumber ? `${label(game)}${game.turn() === "w" ? "" : " "}` : "";
  const joiner = trimmed === "" ? "" : isFenOnly ? "\n" : " ";
  return `${trimmed}${joiner}${prefix}${san}`;
}

export function sideToMove(fen: string): "white" | "black" {
  return fen.split(" ")[1] === "b" ? "black" : "white";
}
