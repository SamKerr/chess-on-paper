import { appendMove, cleanMove, fenAt, parseNotation, START_FEN } from "./notation";

const sans = (input: string) => parseNotation(input).plies.map((p) => p.san);

describe("parseNotation", () => {
  it("treats empty input and 'start' as the initial position", () => {
    for (const input of ["", "   ", "start"]) {
      const parsed = parseNotation(input);
      expect(parsed.startFen).toBe(START_FEN);
      expect(parsed.plies).toEqual([]);
      expect(parsed.problem).toBeNull();
    }
  });

  it("plays numbered and unnumbered SAN", () => {
    expect(sans("1.e4 e5 2.Nf3 Nc6 3.Bb5")).toEqual(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(sans("1. e4 e5 2. Nf3")).toEqual(["e4", "e5", "Nf3"]);
    expect(sans("e4 e5 Nf3")).toEqual(["e4", "e5", "Nf3"]);
  });

  it("labels plies with move numbers", () => {
    const labels = parseNotation("1.e4 e5 2.Nf3").plies.map((p) => p.label);
    expect(labels).toEqual(["1.", "1...", "2."]);
  });

  it("accepts handwriting conventions", () => {
    const input =
      "1.e4 e5!? 2.Nf3 Nc6 3.Bc4 Bc5 4.0-0 Nf6 5.d4 e×d4 {the main line} 6.e5?! $6 d5 ; ok\n7.exd6e.p. 1-0";
    expect(sans(input)).toEqual([
      "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "O-O", "Nf6", "d4", "exd4", "e5", "d5", "exd6",
    ]);
    expect(parseNotation(input).problem).toBeNull();
  });

  it("accepts moves typed in lower case", () => {
    expect(sans("1.e4 e5 2.nf3 nc6 3.bb5 a6 4.bxc6 dxc6 5.o-o qd6")).toEqual([
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6", "O-O", "Qd6",
    ]);
    expect(sans("4k3/P7/8/8/8/8/8/4K3 w - - 0 1 a8=q+")).toEqual(["a8=Q+"]);
    expect(sans("1.E4 E5 2.NF3")).toEqual(["e4", "e5", "Nf3"]);
  });

  it("reads a lower-case b as the pawn when the pawn can make the move", () => {
    // Only the bishop can take on c3: a lower-case b is read as the bishop.
    expect(sans("4k3/8/8/8/1b6/2N5/1p6/4K3 b - - 0 1 bxc3+")).toEqual(["Bxc3+"]);
    // Both the b-pawn and the bishop can take: the text means what it says.
    const both = "4k3/8/8/4b3/1p6/2N5/8/4K3 b - - 0 1";
    expect(sans(`${both} bxc3`)).toEqual(["bxc3"]);
    expect(sans(`${both} Bxc3+`)).toEqual(["Bxc3+"]);
    // Only the pawn can take: a capital B is still a bishop, so it is flagged.
    const pawnOnly = "4k3/8/8/b7/1p6/2N5/8/4K3 b - - 0 1";
    expect(sans(`${pawnOnly} bxc3`)).toEqual(["bxc3"]);
    expect(parseNotation(`${pawnOnly} Bxc3`).problem?.message).toMatch(/Bxc3 is not legal here/);
  });

  it("still flags an illegal lower-case move, with the moves you might have meant", () => {
    const parsed = parseNotation("1.e4 e5 2.nf4");
    expect(parsed.plies).toHaveLength(2);
    expect(parsed.problem?.message).toMatch(/2\. nf4 is not legal here/);
  });

  it("accepts check and mate marks", () => {
    expect(sans("1.f3 e5 2.g4 Qh4#")).toEqual(["f3", "e5", "g4", "Qh4#"]);
    expect(sans("1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7")).toContain("Qxf7#");
  });

  it("starts from a FEN, with or without the trailing fields", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 40";
    const parsed = parseNotation(`${fen} 40.e4 Kd7`);
    expect(parsed.startFen).toBe(fen);
    expect(parsed.plies.map((p) => p.label)).toEqual(["40.", "40..."]);

    const short = parseNotation("4k3/8/8/8/8/8/4P3/4K3 b");
    expect(short.problem).toBeNull();
    expect(short.startFen).toBe("4k3/8/8/8/8/8/4P3/4K3 b - - 0 1");
  });

  it("draws positions without kings but refuses to play moves from them", () => {
    const structure = parseNotation("8/pp3ppp/2p5/3p4/3P4/8/PP3PPP/8");
    expect(structure.problem).toBeNull();
    expect(structure.startFen).toContain("8/pp3ppp/2p5");

    const withMoves = parseNotation("8/pp3ppp/2p5/3p4/3P4/8/PP3PPP/8 w a3");
    expect(withMoves.problem?.message).toMatch(/without both kings/);
  });

  it("reports a bad FEN over the FEN's range", () => {
    const parsed = parseNotation("rnbqkbnr/pppppppp/8/8 w");
    expect(parsed.problem?.message).toMatch(/FEN/);
    expect(parsed.problem?.start).toBe(0);
  });

  it("reports an illegal move with its position and the moves you might have meant", () => {
    const input = "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.Bxf7";
    const parsed = parseNotation(input);
    expect(parsed.plies).toHaveLength(8);
    expect(parsed.problem).toMatchObject({ start: input.indexOf("5.Bxf7"), end: input.length });
    expect(parsed.problem?.message).toBe("5. Bxf7 is not legal here.");

    const typo = parseNotation("1.e4 e5 2.Bf3");
    expect(typo.problem?.message).toMatch(/2\. Bf3 is not legal here\. Legal moves to that square: Nf3, Qf3, f3\./);
    expect(typo.problem?.suggestions).toEqual(["Nf3", "Qf3", "f3"]);
  });

  it("explains ambiguous moves", () => {
    const amb = parseNotation("1.Nf3 Nf6 2.d3 d6 3.Nd2");
    expect(amb.problem?.message).toBe("3. Nd2 is ambiguous. Say which piece: Nbd2 or Nfd2.");
    expect(amb.problem?.suggestions).toEqual(["Nbd2", "Nfd2"]);
    expect(sans("1.Nf3 Nf6 2.d3 d6 3.Nbd2")).toHaveLength(5);
  });

  it("catches a move number that doesn't match, which usually means a dropped move", () => {
    const parsed = parseNotation("1.e4 e5 2.Nf3 3.Bb5");
    expect(parsed.plies).toHaveLength(3);
    expect(parsed.problem?.message).toBe(
      "Move number 3. is written here, but the next move is 2.... A move may be missing or written twice.",
    );
  });

  it("accepts a numbered Black move", () => {
    expect(sans("1.e4 1...c5")).toEqual(["e4", "c5"]);
    expect(sans("4k3/8/8/8/8/8/4P3/4K3 b - - 0 7 7...Kd7")).toEqual(["Kd7"]);
  });

  it("reports moves after the game is over", () => {
    const parsed = parseNotation("1.f3 e5 2.g4 Qh4# 3.a3");
    expect(parsed.problem?.message).toMatch(/game is already over/);
  });
});

describe("cleanMove", () => {
  it.each([
    ["0-0", "O-O"],
    ["0-0-0", "O-O-O"],
    ["Nxe5!", "Nxe5"],
    ["Bb5+", "Bb5"],
    ["exd6e.p.", "exd6"],
    ["e:d5", "exd5"],
    ["Qh4#", "Qh4"],
    ["e8=Q+!", "e8=Q"],
  ])("%s -> %s", (input, expected) => {
    expect(cleanMove(input)).toBe(expected);
  });
});

describe("fenAt", () => {
  it("returns the start, an intermediate and the final position", () => {
    const parsed = parseNotation("1.e4 e5");
    expect(fenAt(parsed, 0)).toBe(START_FEN);
    expect(fenAt(parsed, 1)).toBe(parsed.plies[0].fen);
    expect(fenAt(parsed, 99)).toBe(parsed.plies[1].fen);
  });
});

describe("appendMove", () => {
  it("numbers White moves and continues Black moves", () => {
    expect(appendMove("", START_FEN, "e4")).toBe("1.e4");
    const afterE4 = parseNotation("1.e4").plies[0].fen;
    expect(appendMove("1.e4", afterE4, "c5")).toBe("1.e4 c5");
    const afterC5 = parseNotation("1.e4 c5").plies[1].fen;
    expect(appendMove("1.e4 c5  ", afterC5, "Nf3")).toBe("1.e4 c5 2.Nf3");
  });

  it("puts moves on a new line after a bare FEN, with a Black move number", () => {
    const fen = "4k3/8/8/8/8/8/4P3/4K3 b - - 0 7";
    expect(appendMove(fen, fen, "Kd7")).toBe(`${fen}\n7... Kd7`);
    expect(parseNotation(`${fen}\n7... Kd7`).plies).toHaveLength(1);
  });

  it("renumbers after a comment", () => {
    const fen = parseNotation("1.e4").plies[0].fen;
    expect(appendMove("1.e4 {best by test}", fen, "e5")).toBe("1.e4 {best by test} 1... e5");
  });
});

describe("positions from links", () => {
  const ruy = "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4";

  it.each([
    [`https://lichess.org/analysis/${ruy.replace(/ /g, "_")}`],
    [`https://lichess.org/analysis/standard/${ruy.replace(/ /g, "_")}`],
    [`https://lichess.org/editor/${ruy.replace(/ /g, "_")}`],
    [`https://www.chess.com/analysis?fen=${encodeURIComponent(ruy)}`],
    [`https://example.com/board?fen=${ruy.replace(/ /g, "+")}`],
  ])("reads %s", (url) => {
    const parsed = parseNotation(url);
    expect(parsed.problem).toBeNull();
    expect(parsed.startFen).toBe(ruy);
  });

  it("plays moves written after the link", () => {
    const parsed = parseNotation(`https://lichess.org/analysis/${ruy.replace(/ /g, "_")} 4.Ba4 Nf6`);
    expect(parsed.plies.map((p) => p.san)).toEqual(["Ba4", "Nf6"]);
  });

  it("reports links without a position", () => {
    const parsed = parseNotation("https://lichess.org/abcdEFGH");
    expect(parsed.problem).toMatchObject({ start: 0, end: 28 });
    expect(parsed.problem?.message).toMatch(/doesn't contain a position/);
  });
});
