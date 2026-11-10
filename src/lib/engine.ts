/**
 * Stockfish in a Web Worker, spoken to over UCI. It runs entirely in the browser: no
 * position leaves the computer. The engine loads on first use, not at start-up.
 */
import { Chess, validateFen } from "chess.js";
import type { Score } from "./evaluation";

export const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`;
export const DEFAULT_MOVETIME = 1500;

export interface Analysis {
  /** From White's point of view */
  score: Score;
  depth: number;
  /** The engine's main line, in SAN, from the analysed position */
  line: string[];
  /** Set when the game is already over, instead of a real engine score */
  over?: "Checkmate" | "Stalemate" | "Draw";
  /** With several lines asked for: each candidate move's score and line, best first */
  candidates?: { score: Score; line: string[] }[];
}

/** Read the score, depth and main line from a UCI "info" line. Scores are from the side to move. */
export function parseInfo(line: string): { depth: number; multipv: number; score: Score; pv: string[] } | null {
  if (!line.startsWith("info ") || !line.includes(" score ") || line.includes(" lowerbound") || line.includes(" upperbound")) {
    return null;
  }
  const depth = /\bdepth (\d+)/.exec(line);
  const score = /\bscore (cp|mate) (-?\d+)/.exec(line);
  if (!depth || !score) return null;
  const pv = /\bpv (.+)$/.exec(line)?.[1].trim().split(/\s+/) ?? [];
  return {
    depth: Number(depth[1]),
    multipv: Number(/\bmultipv (\d+)/.exec(line)?.[1] ?? 1),
    score: score[1] === "cp" ? { cp: Number(score[2]) } : { mate: Number(score[2]) },
    pv,
  };
}

/** Flip a side-to-move score to White's point of view. */
export function whiteView(score: Score, turn: "w" | "b"): Score {
  if (turn === "w") return score;
  return score.mate !== undefined ? { mate: -score.mate } : { cp: -(score.cp ?? 0) };
}

/** UCI moves ("e2e4", "e7e8q") to SAN from a position; stops at the first it can't play. */
export function uciToSan(fen: string, moves: string[]): string[] {
  const game = new Chess(fen);
  const out: string[] = [];
  for (const m of moves) {
    try {
      out.push(game.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }).san);
    } catch {
      break;
    }
  }
  return out;
}

/** Positions the engine can't or needn't analyse: invalid ones, and finished games. */
export function settledAnalysis(fen: string): Analysis | "invalid" | null {
  if (!validateFen(fen).ok) return "invalid";
  const game = new Chess(fen);
  if (game.isCheckmate()) {
    // The side to move is mated, so the other side has won.
    return { score: { cp: game.turn() === "w" ? -100000 : 100000 }, depth: 0, line: [], over: "Checkmate" };
  }
  if (game.isStalemate()) return { score: { cp: 0 }, depth: 0, line: [], over: "Stalemate" };
  if (game.isDraw()) return { score: { cp: 0 }, depth: 0, line: [], over: "Draw" };
  return null;
}

export interface WorkerLike {
  postMessage(message: string): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  terminate(): void;
}

/** One analysis at a time; a new request waits for the current one to stop. */
export class Engine {
  private worker: WorkerLike;
  private ready: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private listener: ((line: string) => void) | null = null;

  constructor(createWorker: () => WorkerLike = () => new Worker(ENGINE_URL) as unknown as WorkerLike) {
    this.worker = createWorker();
    this.worker.onmessage = (e) => this.listener?.(String(e.data));
    this.ready = this.waitFor("readyok", () => {
      this.send("uci");
      this.send("isready");
    }).then(() => undefined);
  }

  private send(command: string) {
    this.worker.postMessage(command);
  }

  private waitFor(token: string, start: () => void, onLine?: (line: string) => void): Promise<string> {
    return new Promise((resolve) => {
      this.listener = (line) => {
        onLine?.(line);
        if (line.startsWith(token)) {
          this.listener = null;
          resolve(line);
        }
      };
      start();
    });
  }

  /** Analyse a position; `lines` > 1 also compares the engine's top candidate moves. */
  analyse(fen: string, movetime = DEFAULT_MOVETIME, lines = 1): Promise<Analysis> {
    const settled = settledAnalysis(fen);
    if (settled === "invalid") return Promise.reject(new Error("The engine needs a legal position with both kings."));
    if (settled) return Promise.resolve(settled);
    const turn = fen.split(" ")[1] === "b" ? "b" : "w";
    const run = async () => {
      await this.ready;
      // The deepest report for each line; lines are numbered from 1, best first.
      const byLine = new Map<number, NonNullable<ReturnType<typeof parseInfo>>>();
      await this.waitFor(
        "bestmove",
        () => {
          this.send(`setoption name MultiPV value ${lines}`);
          this.send(`position fen ${fen}`);
          this.send(`go movetime ${movetime}`);
        },
        (line) => {
          const info = parseInfo(line);
          const seen = info && byLine.get(info.multipv);
          if (info && (!seen || info.depth >= seen.depth)) byLine.set(info.multipv, info);
        },
      );
      const final = byLine.get(1);
      if (!final) throw new Error("The engine didn't return an evaluation.");
      const analysis: Analysis = { score: whiteView(final.score, turn), depth: final.depth, line: uciToSan(fen, final.pv) };
      if (lines > 1) {
        analysis.candidates = [...byLine.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, info]) => ({ score: whiteView(info.score, turn), line: uciToSan(fen, info.pv) }));
      }
      return analysis;
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  dispose() {
    this.worker.terminate();
  }
}

let shared: Engine | null = null;

/** The app's one engine, created on first use. */
export function getEngine(): Engine {
  shared ??= new Engine();
  return shared;
}
