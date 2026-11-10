import { movesAfter, movesUpTo, numberedLine } from "./format";
import { parseNotation } from "./notation";

describe("movesUpTo", () => {
  const parsed = parseNotation("1.e4 e5 2.Nf3 Nc6 3.Bb5 a6");

  it("numbers the moves up to the ply", () => {
    expect(movesUpTo(parsed, 3)).toBe("1.e4 e5 2.Nf3");
    expect(movesUpTo(parsed, 6)).toBe("1.e4 e5 2.Nf3 Nc6 3.Bb5 a6");
    expect(movesUpTo(parsed, 0)).toBe("");
  });

  it("keeps the latest moves of a long line", () => {
    expect(movesUpTo(parsed, 6, 3)).toBe("… 2...Nc6 3.Bb5 a6");
    expect(movesUpTo(parsed, 5, 2)).toBe("… 2...Nc6 3.Bb5");
  });

  it("starts with a Black move number after a FEN", () => {
    const fromFen = parseNotation("4k3/8/8/8/8/8/4P3/4K3 b - - 0 7 7...Kd7 8.e4");
    expect(movesUpTo(fromFen, 2)).toBe("7...Kd7 8.e4");
  });
});

describe("movesAfter", () => {
  const parsed = parseNotation("1.e4 e5 2.Nf3 Nc6 3.Bb5 a6");

  it("gives the continuation from a position, numbered from its first move", () => {
    expect(movesAfter(parsed, 3)).toBe("2...Nc6 3.Bb5 a6");
    expect(movesAfter(parsed, 0)).toBe("1.e4 e5 2.Nf3 Nc6 3.Bb5 a6");
    expect(movesAfter(parsed, 6)).toBe("");
  });

  it("cuts long answers with a trailing ellipsis", () => {
    expect(movesAfter(parsed, 0, 2)).toBe("1.e4 e5 …");
  });
});

describe("numberedLine", () => {
  it("numbers from the FEN's move number and side to move", () => {
    expect(numberedLine("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", ["Bb5", "a6", "Ba4"])).toBe(
      "3.Bb5 a6 4.Ba4",
    );
    expect(numberedLine("4k3/8/8/8/8/8/4P3/4K3 b - - 0 14", ["Kd7", "e4", "Ke6"])).toBe("14...Kd7 15.e4 Ke6");
    expect(numberedLine("4k3/8/8/8/8/8/4P3/4K3 b - - 0 14", [])).toBe("");
  });
});
