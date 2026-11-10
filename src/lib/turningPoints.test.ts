import { parseNotation } from "./notation";
import { findTurningPoints, severity, whiteChances } from "./turningPoints";

describe("whiteChances", () => {
  it("is even at 0, near-certain for mates, and saturates for big leads", () => {
    expect(whiteChances({ cp: 0 })).toBeCloseTo(0.5);
    expect(whiteChances({ mate: 3 })).toBe(1);
    expect(whiteChances({ mate: -1 })).toBe(0);
    expect(whiteChances({ cp: 100 })).toBeGreaterThan(0.55);
    // A big lead growing bigger isn't a swing: it stays under the inaccuracy threshold.
    expect(whiteChances({ cp: 700 }) - whiteChances({ cp: 500 })).toBeLessThan(0.1);
  });
});

describe("severity", () => {
  it("uses lichess-style thresholds", () => {
    expect(severity(0.05)).toBeNull();
    expect(severity(0.12)).toBe("inaccuracy");
    expect(severity(0.25)).toBe("mistake");
    expect(severity(0.6)).toBe("blunder");
  });
});

describe("findTurningPoints", () => {
  const parsed = parseNotation("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#");

  it("flags the move that threw the game, from the mover's point of view", () => {
    const scores = [{ cp: 20 }, { cp: 30 }, { cp: 25 }, { cp: -40 }, { cp: -30 }, { cp: -35 }, { mate: 1 }, { cp: 100000 }];
    const best = ["e4", "e5", "Nf3", "Nc6", "Bc4", "g6", "Qxf7#", null];
    const points = findTurningPoints(parsed, scores, best);
    expect(points).toEqual([
      expect.objectContaining({ index: 5, label: "3...", san: "Nf6", severity: "blunder", better: "g6" }),
    ]);
    expect(points[0].before).toBeGreaterThan(0.5);
    expect(points[0].after).toBe(0);
  });

  it("includes inaccuracies when asked, and leaves out 'better' when the move played was best", () => {
    const scores = [{ cp: 20 }, { cp: 30 }, { cp: 25 }, { cp: -120 }, { cp: -110 }, { cp: -115 }, { cp: -115 }, { cp: -115 }];
    const points = findTurningPoints(parsed, scores, ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#", null], "inaccuracy");
    expect(points.map((p) => [p.san, p.severity, p.better])).toEqual([["Qh5", "inaccuracy", null]]);
  });

  it("ignores moves without scores on both sides", () => {
    expect(findTurningPoints(parsed, [{ cp: 0 }], [null])).toEqual([]);
  });
});

describe("mistakeDiagrams", () => {
  it("makes an engine-free diagram of the position before each mistake, from the mover's side", async () => {
    const { mistakeDiagrams } = await import("./turningPoints");
    const parsed = parseNotation("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#");
    const scores = [{ cp: 20 }, { cp: 30 }, { cp: 25 }, { cp: -40 }, { cp: -30 }, { cp: -35 }, { mate: 1 }, { cp: 100000 }];
    const points = findTurningPoints(parsed, scores, ["e4", "e5", "Nf3", "Nc6", "Bc4", "g6", "Qxf7#", null]);
    const [d] = mistakeDiagrams("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#", points);
    expect(d).toMatchObject({ ply: 5, flipped: true, caption: "3...Nf6?? was played. What’s better, and why?" });
    expect(d.caption).not.toContain("g6");
  });
});
