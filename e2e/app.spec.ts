import { expect, test, type Locator, type Page } from "@playwright/test";

const board = (page: Page) => page.locator("svg.board-large");

/** Centre of a square on the large board, assuming coordinates are shown (16-unit margin). */
async function squarePoint(b: Locator, square: string, flipped = false) {
  await b.scrollIntoViewIfNeeded();
  const box = (await b.boundingBox())!;
  const vb = (await b.getAttribute("viewBox"))!.split(" ").map(Number);
  const scale = box.width / vb[2];
  const file = "abcdefgh".indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  const col = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;
  return { x: box.x + (16 + col * 45 + 22.5) * scale, y: box.y + (2 + row * 45 + 22.5) * scale };
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, button: "left" | "right" = "left") {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down({ button });
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up({ button });
}

test.beforeEach(async ({ page }) => {
  // Every visit starts from one empty position; nothing carries over.
  await page.goto("/");
});

test("asks before closing a sheet with work on it, and keeps nothing afterwards", async ({ page, context }) => {
  await page.getByLabel("Moves or FEN").fill("1.e4 e5");
  const dialog = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const prompt = await dialog;
  expect(prompt.type()).toBe("beforeunload");
  await prompt.accept();

  const fresh = await context.newPage();
  await fresh.goto("/");
  await expect(fresh.getByLabel("Moves or FEN")).toHaveValue("");
  expect(await fresh.evaluate(() => localStorage.length)).toBe(0);
});

test("plays moves by dragging and by clicking, writing them into the notation", async ({ page }) => {
  const b = board(page);
  await drag(page, await squarePoint(b, "e2"), await squarePoint(b, "e4"));
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("1.e4");

  await page.mouse.click(...Object.values(await squarePoint(b, "c7")) as [number, number]);
  await page.mouse.click(...Object.values(await squarePoint(b, "c5")) as [number, number]);
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("1.e4 c5");

  // Illegal drags do nothing.
  await drag(page, await squarePoint(b, "g1"), await squarePoint(b, "g3"));
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("1.e4 c5");
  await expect(b.getByTestId("dragged-piece")).toHaveCount(0);
});

test("asks which piece a pawn promotes to", async ({ page }) => {
  const notation = page.getByLabel("Moves or FEN");
  const fen = "8/4P2k/8/8/8/8/1p6/4K3 w - - 0 1";
  await notation.fill(fen);
  const b = board(page);
  await drag(page, await squarePoint(b, "e7"), await squarePoint(b, "e8"));
  const choice = page.getByRole("group", { name: "Promote to" });
  await expect(choice.getByRole("button")).toHaveCount(5);
  await expect(notation).toHaveValue(fen);
  await page.screenshot({ path: "test-results/screens/promotion.png" });

  // Cancel leaves the pawn where it was.
  await choice.getByRole("button", { name: "Cancel" }).click();
  await expect(choice).toBeHidden();
  await expect(notation).toHaveValue(fen);

  await drag(page, await squarePoint(b, "e7"), await squarePoint(b, "e8"));
  await choice.getByRole("button", { name: "Knight" }).click();
  await expect(notation).toHaveValue(`${fen}\n1.e8=N`);
  await expect(b.locator("[data-piece='N'][data-square='e8']")).toHaveCount(1);

  // Black promotes by clicking, with black pieces to choose from; an ordinary move just plays.
  await page.mouse.click(...(Object.values(await squarePoint(b, "b2")) as [number, number]));
  await page.mouse.click(...(Object.values(await squarePoint(b, "b1")) as [number, number]));
  await choice.getByRole("button", { name: "Queen" }).click();
  await expect(notation).toHaveValue(`${fen}\n1.e8=N b1=Q+`);
  await drag(page, await squarePoint(b, "e1"), await squarePoint(b, "e2"));
  await expect(notation).toHaveValue(`${fen}\n1.e8=N b1=Q+ 2.Ke2`);
});

test("carries a dragged piece under the pointer until it is dropped", async ({ page }) => {
  const b = board(page);
  const from = await squarePoint(b, "g1");
  const to = await squarePoint(b, "f3");
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 });

  const carried = b.getByTestId("dragged-piece");
  await expect(carried).toHaveCount(1);
  const box = (await carried.boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - to.x)).toBeLessThan(6);
  expect(Math.abs(box.y + box.height / 2 - to.y)).toBeLessThan(6);
  await expect(b.locator("[data-square=g1]")).toHaveAttribute("opacity", "0.3");
  await expect(b.getByTestId("drop-target")).toHaveCount(1);
  await page.screenshot({ path: "test-results/screens/dragging.png" });

  await page.mouse.up();
  await expect(carried).toHaveCount(0);
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("1.Nf3");
  await expect(b.locator("[data-square=f3]")).not.toHaveAttribute("opacity", /.*/);

  // Dropped on an illegal square, the piece goes home.
  const e7 = await squarePoint(b, "e7");
  await drag(page, e7, await squarePoint(b, "e3"));
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("1.Nf3");
  await expect(b.locator("[data-square=e7]")).not.toHaveAttribute("opacity", /.*/);
});

test("draws arrows and circles with the right button and in draw mode", async ({ page }) => {
  const b = board(page);
  await drag(page, await squarePoint(b, "g1"), await squarePoint(b, "f3"), "right");
  await expect(b.locator("[data-testid=arrow]")).toHaveCount(1);
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("");

  await page.getByRole("radio", { name: "Draw", exact: true }).click();
  await page.getByRole("radio", { name: "red" }).click();
  const f7 = await squarePoint(b, "f7");
  await page.mouse.click(f7.x, f7.y);
  await expect(b.locator("[data-testid=circle]")).toHaveCount(1);
  await expect(b.locator("[data-testid=circle]")).toHaveAttribute("stroke", "#b3261e");

  // Same arrow again removes it.
  await drag(page, await squarePoint(b, "g1"), await squarePoint(b, "f3"));
  await expect(b.locator("[data-testid=arrow]")).toHaveCount(1); // recoloured red, not removed
  await drag(page, await squarePoint(b, "g1"), await squarePoint(b, "f3"));
  await expect(b.locator("[data-testid=arrow]")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear marks" }).click();
  await expect(b.locator("[data-testid=circle]")).toHaveCount(0);
});

test("prints one A4 page per six diagrams, without the app chrome", async ({ page }) => {
  await page.getByRole("button", { name: "+ Position" }).first().click();
  await page.getByLabel("Moves or FEN").fill("1.d4 d5 2.c4");
  await page.getByRole("button", { name: "+ Blank board" }).first().click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "+ Position" }).first().click();
  await expect(page.getByRole("button", { name: "Print 2 pages" })).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".app")).toBeHidden();
  const pages = page.locator(".print-only .page");
  await expect(pages).toHaveCount(2);
  const box = (await pages.first().boundingBox())!;
  // 210mm x 297mm at 96dpi
  expect(Math.round(box.width)).toBe(794);
  expect(Math.round(box.height)).toBe(1123);

  const pdf = await page.pdf({ format: "A4", printBackground: false });
  const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pageCount).toBe(2);
});

test("looks right", async ({ page }) => {
  await page.getByLabel("Moves or FEN").fill("1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7");
  await page.getByLabel("Caption").fill("Closed Ruy Lopez: White's usual plan is Re1, c3 and d4.");
  const b = board(page);
  await drag(page, await squarePoint(b, "c2"), await squarePoint(b, "c3"), "right");
  await drag(page, await squarePoint(b, "d2"), await squarePoint(b, "d4"), "right");
  await page.mouse.click(...Object.values(await squarePoint(b, "e5")) as [number, number], { button: "right" });
  await page.screenshot({ path: "test-results/screens/editor.png", fullPage: true });

  await page.getByLabel("Moves or FEN").fill("1.e4 e5 2.Bf3");
  await page.screenshot({ path: "test-results/screens/problem.png" });

  await page.getByRole("tab", { name: "Print preview" }).click();
  await page.screenshot({ path: "test-results/screens/preview.png", fullPage: true });

  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("tab", { name: "Edit" }).click();
  await page.screenshot({ path: "test-results/screens/dark.png" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/screens/mobile.png" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("sets up a position by clicking squares and dragging pieces", async ({ page }) => {
  const b = board(page);
  await page.getByRole("radio", { name: "Set up" }).click();
  await page.getByRole("button", { name: "Empty board" }).click();
  const click = async (sq: string) => {
    const p = await squarePoint(b, sq);
    await page.mouse.click(p.x, p.y);
  };
  await page.getByRole("radio", { name: "White king" }).click();
  await click("g1");
  await page.getByRole("radio", { name: "Black king" }).click();
  await click("g8");
  await page.getByRole("radio", { name: "White rook" }).click();
  await click("a1");
  await drag(page, await squarePoint(b, "a1"), await squarePoint(b, "a7"));
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("6k1/R7/8/8/8/8/8/6K1 w - - 0 1");

  // The set-up position is playable: switch back and play a move from it.
  await page.getByRole("radio", { name: "Move", exact: true }).click();
  await drag(page, await squarePoint(b, "g1"), await squarePoint(b, "f2"));
  await expect(page.getByLabel("Moves or FEN")).toHaveValue("6k1/R7/8/8/8/8/8/6K1 w - - 0 1\n1.Kf2");
});

test("new features look right", async ({ page }) => {
  await page.getByRole("radio", { name: "Set up" }).click();
  await page.screenshot({ path: "test-results/screens/setup.png" });

  await page.getByRole("button", { name: "Import a game (PGN)…" }).click();
  await page.getByLabel("PGN or moves").fill(
    '[White "Kerr"]\n[Black "Smith"]\n[Date "2026.03.14"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 {Breyer} 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 *',
  );
  await page.getByLabel("Moves between diagrams").fill("4");
  await page.screenshot({ path: "test-results/screens/import.png" });
  await page.getByRole("button", { name: /^Add \d+ diagrams$/ }).click();
  await page.getByRole("checkbox", { name: "Figurine notation" }).check();
  await page.getByRole("tab", { name: "Print preview" }).click();
  await page.screenshot({ path: "test-results/screens/preview-moves.png" });
});

test("prints fold-over flashcards", async ({ page }) => {
  const notation = page.getByLabel("Moves or FEN");
  await page.getByLabel("Sheet title").fill("Rook endings");
  await notation.fill("8/8/8/8/8/2k5/1R6/K7 w - - 0 1");
  await page.getByLabel("Caption").fill("Cut the king off along a file first.");

  await page.getByRole("button", { name: "+ Position" }).first().click();
  await notation.fill("1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Nc3 Nxe4 8.O-O Bxc3");
  await page.getByRole("button", { name: "5. d4" }).click();
  await page.getByLabel("Caption").fill("Who stands better after the dust settles?");

  await page.getByRole("tab", { name: "Print preview" }).click();
  await page.getByRole("radio", { name: "Flashcards" }).click();
  await expect(page.getByRole("button", { name: "Print 1 page" })).toBeVisible();
  await page.screenshot({ path: "test-results/screens/cards-preview.png", fullPage: true });

  await page.emulateMedia({ media: "print" });
  const card = page.locator(".print-only .card").first();
  const box = (await card.boundingBox())!;
  // Cards span the printable width (210mm less 24mm of margins = 186mm at 96dpi ≈ 703px).
  expect(Math.round(box.width)).toBeGreaterThan(690);
  const pdf = await page.pdf({ format: "A4" });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1);
});

test("runs Stockfish in the browser to reveal an evaluation", async ({ page }) => {
  // White mates in one with Qxf7#.
  await page.getByLabel("Moves or FEN").fill("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
  const panel = page.getByRole("region", { name: "Guess the evaluation" });
  await panel.getByRole("button", { name: "White is winning" }).click();
  await expect(panel.locator(".eval-depth")).toBeVisible({ timeout: 20000 });
  await expect(panel).toContainText("#1");
  await expect(panel).toContainText("Spot on");
  await expect(panel).toContainText(/Best line, depth \d+: 4\.Qxf7#/);

  // A quiet opening position: the engine calls it roughly level.
  await page.getByLabel("Moves or FEN").fill("1.e4 e5 2.Nf3 Nc6 3.Bb5 $14 {Pressure on e5.} a6 4.Ba4 Nf6");
  await page.getByRole("button", { name: "3. Bb5" }).click();
  const quiet = page.getByRole("region", { name: "Guess the evaluation" });
  await quiet.getByRole("button", { name: "White is slightly better" }).click();
  await expect(quiet.locator(".eval-depth")).toBeVisible({ timeout: 20000 });
  const engineRow = quiet.locator(".eval-row", { hasText: "Engine" });
  const score = Number((await engineRow.locator(".eval-score").textContent())!.replace("−", "-"));
  expect(Math.abs(score)).toBeLessThan(1.5);
  await expect(quiet).toContainText("Pressure on e5.");
  await page.screenshot({ path: "test-results/screens/eval-guess.png" });
});

test("finds the blunder in a game with the real engine", async ({ page }) => {
  await page.getByLabel("Moves or FEN").fill("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#");
  const panel = page.getByRole("region", { name: "Turning points" });
  await panel.getByRole("button", { name: "Check the game with the engine" }).click();
  const list = panel.getByRole("status", { name: "Mistakes" });
  await expect(list).toBeVisible({ timeout: 30000 });
  await expect(list).toContainText("3...Nf6");
  await expect(list).toContainText("blunder");
  await page.screenshot({ path: "test-results/screens/turning-points.png" });
});
