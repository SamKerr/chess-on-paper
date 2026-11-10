import {
  compareVerdicts,
  formatScore,
  scoreFromComment,
  splitWrittenVerdict,
  stripCommands,
  verdictFromNag,
  verdictFromScore,
  verdictFromToken,
} from "./evaluation";
import { parseNotation } from "./notation";

describe("written evaluations", () => {
  it.each([
    ["Nf3±", "Nf3", "+/-"],
    ["Nf3!±", "Nf3!", "+/-"],
    ["Qxf7+-", "Qxf7", "+-"],
    ["Bb5+/=", "Bb5", "+="],
    ["Ra8=", "Ra8", "="],
    ["Nd5∞", "Nd5", "unclear"],
    ["e8=Q", "e8=Q", null],
    ["e8=", "e8=", null],
    ["exd8=", "exd8=", null],
    ["Qh4+", "Qh4+", null],
    ["Qh4#", "Qh4#", null],
  ])("%s -> %s, %s", (token, move, verdict) => {
    expect(splitWrittenVerdict(token)).toEqual([move, verdict]);
  });

  it("reads standalone symbols and NAGs", () => {
    expect(verdictFromToken("±")).toBe("+/-");
    expect(verdictFromToken("=")).toBe("=");
    expect(verdictFromToken("Nf3")).toBeNull();
    expect(verdictFromNag(14)).toBe("+=");
    expect(verdictFromNag(19)).toBe("-+");
    expect(verdictFromNag(1)).toBeNull();
  });
});

describe("engine scores", () => {
  it.each([
    [{ cp: 0 }, "="],
    [{ cp: 30 }, "="],
    [{ cp: 31 }, "+="],
    [{ cp: -90 }, "=+"],
    [{ cp: 150 }, "+/-"],
    [{ cp: -201 }, "-+"],
    [{ mate: 3 }, "+-"],
    [{ mate: -1 }, "-+"],
  ])("%o -> %s", (score, verdict) => expect(verdictFromScore(score)).toBe(verdict));

  it("formats scores like a chess player writes them", () => {
    expect(formatScore({ cp: 63 })).toBe("+0.6");
    expect(formatScore({ cp: -140 })).toBe("−1.4");
    expect(formatScore({ cp: 0 })).toBe("0.0");
    expect(formatScore({ cp: -1 })).toBe("0.0");
    expect(formatScore({ cp: -16 })).toBe("−0.2");
    expect(formatScore({ mate: 4 })).toBe("#4");
    expect(formatScore({ mate: -2 })).toBe("#−2");
  });

  it("reads lichess [%eval] and strips [%commands]", () => {
    expect(scoreFromComment("[%eval 0.35] [%clk 0:03:00]")).toEqual({ cp: 35 });
    expect(scoreFromComment("[%eval #-3]")).toEqual({ mate: -3 });
    expect(scoreFromComment("just words")).toBeNull();
    expect(stripCommands("[%eval 0.35] [%clk 0:03:00] A good move.")).toBe("A good move.");
  });
});

describe("compareVerdicts", () => {
  it("counts one step as close and crossing equality as the wrong side", () => {
    expect(compareVerdicts("+/-", "+/-")).toBe("exact");
    expect(compareVerdicts("+=", "+/-")).toBe("close");
    expect(compareVerdicts("=", "=+")).toBe("close");
    expect(compareVerdicts("+=", "-/+")).toBe("wrong-side");
    expect(compareVerdicts("+-", "+=")).toBe("off");
    expect(compareVerdicts("unclear", "=")).toBe("off");
    expect(compareVerdicts("unclear", "unclear")).toBe("exact");
  });
});

describe("evaluations in games", () => {
  it("attaches glyphs, NAGs and spaced symbols to the move before them", () => {
    const p = parseNotation("1.e4 e5 2.Nf3± Nc6 $15 3.Bb5 += a6 = 4.Ba4 $1");
    expect(p.problem).toBeNull();
    expect(p.plies.map((x) => x.verdict ?? null)).toEqual([null, null, "+/-", "=+", "+=", "=", null]);
  });

  it("keeps lichess engine scores and ignores clock comments", () => {
    const p = parseNotation("1. e4 { [%eval 0.3] [%clk 0:05:00] } 1... e5 { [%eval 0.25] [%clk 0:05:00] } 2. Nf3 { [%eval #4] Strong. }");
    expect(p.plies.map((x) => x.score)).toEqual([{ cp: 30 }, { cp: 25 }, { mate: 4 }]);
    expect(p.plies.map((x) => x.annotated)).toEqual([false, false, true]);
    expect(p.plies.map((x) => x.comment)).toEqual([undefined, undefined, "Strong."]);
  });
});
