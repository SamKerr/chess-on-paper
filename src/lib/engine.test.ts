import { Engine, parseInfo, settledAnalysis, uciToSan, whiteView, type WorkerLike } from "./engine";
import { START_FEN } from "./notation";

/** A stand-in for the Stockfish worker that answers UCI commands from a script. */
class FakeWorker implements WorkerLike {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  sent: string[] = [];
  constructor(private reply: (command: string) => string[]) {}
  postMessage(command: string) {
    this.sent.push(command);
    const lines = this.reply(command);
    queueMicrotask(() => lines.forEach((data) => this.onmessage?.({ data })));
  }
  terminate() {}
}

function fakeEngine(infos: string[], best = "bestmove e2e4") {
  let worker!: FakeWorker;
  const engine = new Engine(() => {
    worker = new FakeWorker((c) =>
      c === "uci" ? ["id name Fake", "uciok"] : c === "isready" ? ["readyok"] : c.startsWith("go") ? [...infos, best] : [],
    );
    return worker;
  });
  return { engine, worker: () => worker };
}

describe("parseInfo", () => {
  it("reads depth, score and main line", () => {
    expect(parseInfo("info depth 18 seldepth 25 multipv 1 score cp 34 nodes 1 nps 2 pv e2e4 e7e5 g1f3")).toEqual({
      depth: 18,
      multipv: 1,
      score: { cp: 34 },
      pv: ["e2e4", "e7e5", "g1f3"],
    });
    expect(parseInfo("info depth 9 score mate -3 pv h7h6")?.score).toEqual({ mate: -3 });
  });

  it("ignores lines without a usable score", () => {
    expect(parseInfo("info string NNUE enabled")).toBeNull();
    expect(parseInfo("info depth 10 score cp 20 lowerbound pv e2e4")).toBeNull();
    expect(parseInfo("bestmove e2e4")).toBeNull();
  });
});

describe("helpers", () => {
  it("flips scores to White's view when Black is to move", () => {
    expect(whiteView({ cp: 50 }, "b")).toEqual({ cp: -50 });
    expect(whiteView({ mate: 2 }, "b")).toEqual({ mate: -2 });
    expect(whiteView({ cp: 50 }, "w")).toEqual({ cp: 50 });
  });

  it("turns UCI moves into SAN and stops at a bad one", () => {
    expect(uciToSan(START_FEN, ["e2e4", "e7e5", "g1f3", "zzzz", "b8c6"])).toEqual(["e4", "e5", "Nf3"]);
    expect(uciToSan("8/4P3/8/8/8/8/k7/4K3 w - - 0 1", ["e7e8n"])).toEqual(["e8=N"]);
  });

  it("settles finished and invalid positions without the engine", () => {
    expect(settledAnalysis("8/8/8/3p4/8/8/8/8 w - - 0 1")).toBe("invalid");
    const mated = settledAnalysis("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    expect(mated).toMatchObject({ over: "Checkmate" });
    expect((mated as { score: { cp: number } }).score.cp).toBeLessThan(0);
    expect(settledAnalysis("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")).toMatchObject({ over: "Stalemate", score: { cp: 0 } });
    expect(settledAnalysis(START_FEN)).toBeNull();
  });
});

describe("Engine", () => {
  it("analyses with UCI and reports the deepest line from White's view", async () => {
    const { engine, worker } = fakeEngine([
      "info depth 10 score cp 40 pv e7e5",
      "info depth 12 score cp 55 pv c7c5 g1f3",
    ]);
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const analysis = await engine.analyse(fen, 500);
    expect(analysis).toEqual({ score: { cp: -55 }, depth: 12, line: ["c5", "Nf3"] });
    expect(worker().sent).toEqual(["uci", "isready", "setoption name MultiPV value 1", `position fen ${fen}`, "go movetime 500"]);
  });

  it("runs requests one after another", async () => {
    const { engine, worker } = fakeEngine(["info depth 5 score cp 10 pv e2e4"]);
    const [a, b] = await Promise.all([engine.analyse(START_FEN, 100), engine.analyse(START_FEN, 200)]);
    expect(a.score).toEqual({ cp: 10 });
    expect(b.score).toEqual({ cp: 10 });
    expect(worker().sent.filter((c) => c.startsWith("go"))).toEqual(["go movetime 100", "go movetime 200"]);
  });

  it("refuses positions without both kings", async () => {
    const { engine } = fakeEngine([]);
    await expect(engine.analyse("8/8/8/3p4/8/8/8/8 w - - 0 1")).rejects.toThrow(/both kings/);
  });

  it("fails clearly when the engine gives no evaluation", async () => {
    const { engine } = fakeEngine([]);
    await expect(engine.analyse(START_FEN)).rejects.toThrow(/didn't return an evaluation/);
  });
});

describe("Engine candidate moves", () => {
  it("collects the deepest report for each line, best first, from White's view", async () => {
    const { engine, worker } = fakeEngine([
      "info depth 10 multipv 1 score cp 30 pv e2e4",
      "info depth 10 multipv 2 score cp 20 pv d2d4",
      "info depth 12 multipv 2 score cp 15 pv d2d4 d7d5",
      "info depth 12 multipv 1 score cp 35 pv e2e4 e7e5",
      "info depth 12 multipv 3 score cp -5 pv g1f3",
    ]);
    const analysis = await engine.analyse(START_FEN, 400, 3);
    expect(worker().sent).toContain("setoption name MultiPV value 3");
    expect(analysis.score).toEqual({ cp: 35 });
    expect(analysis.candidates).toEqual([
      { score: { cp: 35 }, line: ["e4", "e5"] },
      { score: { cp: 15 }, line: ["d4", "d5"] },
      { score: { cp: -5 }, line: ["Nf3"] },
    ]);
  });
});
