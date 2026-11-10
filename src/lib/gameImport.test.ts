import { gameTitle, importGame, lineUpTo, mainLine, pickPlies } from "./gameImport";
import { parseNotation } from "./notation";

const PGN = `[Event "Club Championship"]
[Site "?"]
[Date "2026.03.14"]
[White "Kerr, S."]
[Black "Smith, J."]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 (3... Nf6 4. O-O (4. d3 Bc5) 4... Nxe4) 4. Ba4 Nf6
5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 {Breyer: the knight reroutes to d7.}
10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 $6
17. Bg5 h6 18. Be3 Nc5 19. Qd2?! h5 20. Bg5 Be7 21. Ra3?? 1-0`;

describe("parsing PGN", () => {
  const parsed = parseNotation(PGN);

  it("reads headers and skips nested variations", () => {
    expect(parsed.problem).toBeNull();
    expect(parsed.headers).toMatchObject({ White: "Kerr, S.", Black: "Smith, J.", Date: "2026.03.14" });
    expect(parsed.plies).toHaveLength(41);
    expect(parsed.plies[6].san).toBe("Ba4");
  });

  it("marks annotated moves and keeps their comments", () => {
    const annotated = parsed.plies.filter((p) => p.annotated).map((p) => `${p.label}${p.san}`);
    expect(annotated).toEqual(["9...Nb8", "16...c4", "19.Qd2", "21.Ra3"]);
    expect(parsed.plies[17].comment).toBe("Breyer: the knight reroutes to d7.");
  });

  it("starts from a [FEN] tag", () => {
    const fromTag = parseNotation('[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 50"]\n\n50. e4 Kd7');
    expect(fromTag.problem).toBeNull();
    expect(fromTag.plies.map((p) => p.label)).toEqual(["50.", "50..."]);
  });

  it("still points at the right characters after headers and variations", () => {
    const bad = `[White "A"]\n1. e4 (1. d4 d5) e5 2. Bf3`;
    const problem = parseNotation(bad).problem!;
    expect(bad.slice(problem.start, problem.end)).toBe("Bf3");
  });

  it("ignores comments and variations inside variations", () => {
    const p = parseNotation("1. e4 (1. d4 {queen's pawn} (1. c4)) e5 {open game}");
    expect(p.plies.map((x) => x.san)).toEqual(["e4", "e5"]);
    expect(p.plies[0].comment).toBeUndefined();
    expect(p.plies[1].comment).toBe("open game");
  });
});

describe("pickPlies", () => {
  const parsed = parseNotation(PGN);

  it("picks every N moves, after Black's move, plus the final position", () => {
    expect(pickPlies(parsed, { kind: "every", moves: 10 })).toEqual([20, 40, 41]);
    expect(pickPlies(parsed, { kind: "every", moves: 0 })).toHaveLength(21);
  });

  it("picks listed moves, White's by default and Black's with ...", () => {
    expect(pickPlies(parsed, { kind: "list", text: "9..., 16 21" })).toEqual([18, 31, 41]);
    expect(pickPlies(parsed, { kind: "list", text: "99" })).toEqual([]);
  });

  it("picks annotated moves", () => {
    expect(pickPlies(parsed, { kind: "annotated" })).toEqual([18, 32, 37, 41]);
  });
});

describe("mainLine", () => {
  it("rewrites the main line as clean numbered SAN", () => {
    expect(mainLine(parseNotation("1. e4 (1. d4) e5 {x} 2. Nf3!"))).toBe("1.e4 e5 2.Nf3");
  });

  it("keeps a non-standard start", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 b - - 0 7";
    const line = mainLine(parseNotation(`${fen} 7... Kd7 8. e4`));
    expect(line).toBe(`${fen}\n7... Kd7 8.e4`);
    expect(parseNotation(line).plies).toHaveLength(2);
  });
});

describe("gameTitle", () => {
  it("joins players, event and year, skipping unknowns", () => {
    expect(gameTitle({ White: "A", Black: "B", Event: "Open", Date: "2024.??.??" })).toBe("A – B, Open 2024");
    expect(gameTitle({ White: "A", Black: "?", Event: "?" })).toBe("A");
    expect(gameTitle({})).toBe("");
  });
});

describe("importGame", () => {
  it("makes one diagram per picked position, captioned with comments", () => {
    const result = importGame(PGN, { kind: "annotated" }, true);
    expect(result.title).toBe("Kerr, S. – Smith, J., Club Championship 2026");
    expect(result.diagrams).toHaveLength(4);
    expect(result.diagrams[0]).toMatchObject({
      ply: 18,
      caption: "Breyer: the knight reroutes to d7.",
      flipped: true,
    });
    expect(result.diagrams[3].ply).toBeNull();
    expect(parseNotation(result.diagrams[0].notation).plies).toHaveLength(41);
  });
});

describe("lineUpTo", () => {
  it("keeps the moves up to a ply, so a branch remembers how it got there", () => {
    const parsed = parseNotation("1.e4 e5 2.Nf3 Nc6 3.Bb5");
    expect(lineUpTo(parsed, 3)).toBe("1.e4 e5 2.Nf3");
    expect(lineUpTo(parsed, 0)).toBe("");
  });
});
