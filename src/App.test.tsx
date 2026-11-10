import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { EngineContext, type Analyse } from "./components/EvalGuess";
import { newDiagram, newSheet, type Sheet } from "./lib/sheet";

/** The sheet the next `render(<App initialSheet={seeded} />)` starts with. */
let seeded: Sheet | undefined;

function seed(notation: string, extra: Partial<ReturnType<typeof newDiagram>> = {}) {
  seeded = newSheet();
  seeded.diagrams = [newDiagram({ notation, ...extra })];
}

beforeEach(() => {
  seeded = undefined;
});

const notationBox = () => screen.getByLabelText("Moves or FEN");
/** The editor's large board is the first diagram on screen; thumbnails and print copies follow. */
const editorBoard = () => document.querySelector<SVGSVGElement>(".board-large")!;

describe("App", () => {
  it("starts with one empty position", () => {
    render(<App />);
    expect(notationBox()).toHaveValue("");
    const editor = screen.getByRole("region", { name: "Edit diagram" });
    expect(within(editor).getByText("Starting position")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is saved/)).toBeInTheDocument();
  });

  it("updates the board as you type and flags an illegal move", async () => {
    seed("");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.type(notationBox(), "1.e4 e5 2.Ke3");
    expect(screen.getByRole("alert")).toHaveTextContent("2. Ke3 is not legal here.");
    expect(notationBox()).toHaveAttribute("aria-invalid", "true");
    expect(editorBoard().querySelector('[data-square="e4"]')).toHaveAttribute("data-piece", "P");
    expect(screen.getByText("Check moves")).toBeInTheDocument();
  });

  it("fixes a typo when you pick a suggestion", async () => {
    seed("1.e4 e5 2.Bf3 Nc6");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Use Nf3" }));
    expect(notationBox()).toHaveValue("1.e4 e5 2.Nf3 Nc6");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("selects the bad move in the text", async () => {
    seed("1.e4 e5 2.Bf3");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Show in text" }));
    const box = notationBox() as HTMLTextAreaElement;
    expect(box).toHaveFocus();
    expect(box.value.slice(box.selectionStart, box.selectionEnd)).toBe("2.Bf3");
  });

  it("steps through moves with the move list and arrow keys", async () => {
    seed("1.e4 e5 2.Nf3");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "1. e4" }));
    expect(screen.getByRole("button", { name: "1. e4" })).toHaveAttribute("aria-current", "step");
    expect(editorBoard().querySelector('[data-square="e5"]')).toBeNull();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "1... e5" })).toHaveAttribute("aria-current", "step");
    fireEvent.keyDown(window, { key: "Home" });
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute("aria-current", "step");
    fireEvent.keyDown(window, { key: "End" });
    expect(screen.getByRole("button", { name: "2. Nf3" })).toHaveAttribute("aria-current", "step");
  });

  it("flips the board", async () => {
    seed("");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    const a1 = () => editorBoard().querySelector('[data-square="a1"]')!.getAttribute("transform");
    const before = a1();
    await user.click(screen.getByRole("button", { name: /Flip/ }));
    expect(a1()).not.toBe(before);
  });

  it("adds a blank board without a notation box", async () => {
    seed("1.e4");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getAllByRole("button", { name: "+ Blank board" })[0]);
    expect(screen.queryByLabelText("Moves or FEN")).not.toBeInTheDocument();
    expect(editorBoard().querySelectorAll("[data-piece]")).toHaveLength(0);
    expect(screen.getByText("Blank board 2")).toBeInTheDocument();
  });

  it("deletes a diagram and brings it back with undo", async () => {
    seed("1.d4", { caption: "Queen's pawn" });
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Delete Queen's pawn" }));
    expect(screen.getByText(/No diagrams yet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Caption")).toHaveValue("Queen's pawn");
  });

  it("reorders diagrams", async () => {
    const sheet = newSheet();
    sheet.diagrams = [newDiagram({ caption: "First" }), newDiagram({ caption: "Second" })];
    seeded = sheet;
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Move Second up" }));
    const list = screen.getByRole("list", { name: "Diagrams on this sheet" });
    const titles = within(list).getAllByText(/First|Second/).map((el) => el.textContent);
    expect(titles).toEqual(["Second", "First"]);
  });

  it("keeps nothing: a fresh start has none of the last sheet", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByLabelText("Sheet title"), "Endgames");
    await user.type(notationBox(), "1.d4");
    unmount();
    render(<App />);
    expect(screen.getByLabelText("Sheet title")).toHaveValue("");
    expect(notationBox()).toHaveValue("");
    expect(localStorage.length).toBe(0);
  });

  it("deletes a sheet that an earlier version saved", () => {
    localStorage.setItem("chess-diagrams:sheet", '{"title":"Old study","diagrams":[]}');
    render(<App />);
    expect(localStorage.getItem("chess-diagrams:sheet")).toBeNull();
    expect(screen.getByLabelText("Sheet title")).toHaveValue("");
  });

  it("asks before leaving only once the sheet has something on it", async () => {
    const user = userEvent.setup();
    render(<App />);
    const leave = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(leave()).toBe(false);
    await user.type(notationBox(), "1.e4");
    expect(leave()).toBe(true);
  });

  it("shows a print preview with the right number of pages", async () => {
    const sheet = newSheet();
    sheet.diagrams = Array.from({ length: 7 }, (_, i) =>
      newDiagram({ notation: "1.e4 e5 2.Nf3", caption: `D${i}` }),
    );
    seeded = sheet;
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    const layouts = screen.getByRole("radiogroup", { name: "Layout" });
    expect(within(layouts).getAllByRole("radio").map((r) => r.textContent)).toEqual(["6 per page", "Flashcards"]);
    expect(screen.getByRole("radio", { name: "6 per page" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Print 2 pages" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Print preview" }));
    const preview = document.querySelector(".preview")!;
    expect(within(preview as HTMLElement).getAllByRole("article")).toHaveLength(2);
    expect(preview.querySelectorAll(".ruled").length).toBe(7);
    expect(preview.querySelectorAll(".slot-moves").length).toBe(7);
  });


  it("imports a game as diagrams at the annotated moves", async () => {
    seed("1.e4");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Import a game (PGN)…" }));
    const dialog = screen.getByRole("dialog", { name: "Import a game" });
    const pgn = '[White "Kerr"]\n[Black "Smith"]\n1. e4 e5 2. Nf3 Nc6 (2... d6) 3. Bb5 {Ruy Lopez} a6 4. Ba4?! Nf6';
    fireEvent.change(within(dialog).getByLabelText("PGN or moves"), { target: { value: pgn } });
    await user.click(within(dialog).getByRole("radio", { name: /Moves marked with/ }));
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "8 moves read. Adds 2 diagrams (after 3.Bb5, 4.Ba4).",
    );
    await user.click(within(dialog).getByRole("button", { name: "Add 2 diagrams" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Sheet title")).toHaveValue("Kerr – Smith");
    expect(screen.getByLabelText("Caption")).toHaveValue("Ruy Lopez");
    expect(screen.getByRole("button", { name: "3. Bb5" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Added 2 diagrams from the game")).toBeInTheDocument();
  });

  it("explains a game it can't read and won't import it", async () => {
    seed("");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "Import a game (PGN)…" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("PGN or moves"), { target: { value: "1. e4 e5 2. Ke3" } });
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Can't read the game: 2. Ke3 is not legal here.",
    );
    expect(within(dialog).getByRole("button", { name: /Add/ })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sets up a position from the palette and side-to-move control, with undo", async () => {
    seed("1.e4");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("radio", { name: "Set up" }));
    expect(screen.getByText("Changing the setup replaces the moves with this position.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Empty board" }));
    expect(notationBox()).toHaveValue("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(screen.getByText(/needs exactly one king/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Black to move" }));
    expect(notationBox()).toHaveValue("8/8/8/8/8/8/8/8 b - - 0 1");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(notationBox()).toHaveValue("1.e4");
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("prints the moves so far, in figurines when chosen", async () => {
    seed("1.e4 e5 2.Nf3 Nc6");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("tab", { name: "Print preview" }));
    const preview = () => document.querySelector(".preview")!;
    expect(preview().querySelector(".slot-moves")).toHaveTextContent("1.e4 e5 2.Nf3 Nc6");
    await user.click(screen.getByRole("checkbox", { name: "Figurine notation" }));
    const moves = preview().querySelector(".slot-moves")!;
    expect(moves.querySelectorAll("svg.figurine")).toHaveLength(2);
    expect(moves).toHaveTextContent("1.e4 e5 2.f3 c6");
    expect(within(moves as HTMLElement).getAllByRole("img").map((el) => el.getAttribute("aria-label"))).toEqual(["N", "N"]);
    expect(preview().querySelector(".slot-after svg.figurine")).not.toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Print the moves so far" }));
    expect(preview().querySelector(".slot-moves")).toBeNull();
  });
  it("starts a new diagram from the position on screen", async () => {
    seed("1.e4 e5 2.Nf3 Nc6", { caption: "Main line", flipped: true });
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("button", { name: "1... e5" }));
    await user.click(screen.getByRole("button", { name: /New diagram from this position/ }));
    expect(notationBox()).toHaveValue("1.e4 e5");
    expect(screen.getByLabelText("Caption")).toHaveValue("");
    const list = screen.getByRole("list", { name: "Diagrams on this sheet" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const titles = [...list.querySelectorAll(".diagram-title")].map((el) => el.textContent);
    expect(titles).toEqual(["Main line", "After 1...e5"]);
    // It continues from there: the board plays on from the branch point.
    expect(screen.getByText("✓ 2 moves checked")).toBeInTheDocument();
  });

  it("reads a position from a pasted lichess link", async () => {
    seed("");
    render(<App initialSheet={seeded} />);
    fireEvent.change(notationBox(), {
      target: { value: "https://lichess.org/analysis/8/8/4k3/8/8/4K3/4P3/8_w_-_-_0_1" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(editorBoard().querySelectorAll("[data-piece]")).toHaveLength(3);
  });
  it("prints a sheet as fold-over flashcards", async () => {
    seeded = newSheet();
    seeded.title = "Ruy Lopez";
    seeded.diagrams = [
      newDiagram({ notation: "1.e4 e5 2.Nf3 Nc6 3.Bb5", caption: "The Spanish bishop eyes the e5 defender." }),
      newDiagram({ kind: "blank" }),
      newDiagram({
        notation: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
        ply: 4,
        caption: "Pressure on the e5 defender.",
        arrows: [{ from: "f1", to: "b5", color: "green" }],
      }),
    ];
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    await user.click(screen.getByRole("radio", { name: "Flashcards" }));
    expect(screen.getByRole("button", { name: "Print 1 page" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Print preview" }));
    const preview = document.querySelector(".preview") as HTMLElement;
    const cards = within(preview).getAllByRole("region", { name: /^Card \d$/ });
    expect(cards).toHaveLength(2);
    const [idea, line] = cards;
    expect(idea.querySelector(".card-front")).not.toHaveTextContent("Spanish bishop");
    expect(idea.querySelector(".card-back")).toHaveTextContent("The Spanish bishop eyes the e5 defender.");
    expect(line.querySelector(".card-front")).not.toHaveTextContent("Bb5");
    expect(line.querySelector(".card-front [data-testid=arrow]")).toBeNull();
    expect(line.querySelector(".card-back")).toHaveTextContent("3.Bb5");
    expect(line.querySelector(".card-back")).toHaveTextContent("Pressure on the e5 defender.");
    expect(line.querySelectorAll(".card-back [data-testid=arrow]")).toHaveLength(1);
  });
  it("guesses the evaluation, then reveals the engine's and the annotator's", async () => {
    seed("1.e4 e5 2.Nf3 Nc6 3.Bb5 $14 {Lasting pressure on e5.} a6", { ply: 5 });
    const seen: string[] = [];
    const analyse: Analyse = async (fen) => {
      seen.push(fen);
      return { score: { cp: 45 }, depth: 16, line: ["a6", "Ba4", "Nf6"] };
    };
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    const panel = screen.getByRole("region", { name: "Guess the evaluation" });
    expect(within(panel).queryByText("Annotator")).not.toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "White is clearly better" }));

    expect(await within(panel).findByText("Engine")).toBeInTheDocument();
    const rows = [...panel.querySelectorAll(".eval-row")].map((r) => r.textContent);
    expect(rows).toEqual([
      "YouWhite is clearly better",
      "EngineWhite is slightly better+0.5One step off",
      "AnnotatorWhite is slightly betterOne step off",
    ]);
    expect(panel).toHaveTextContent("Best line, depth 16: 3...a6 4.Ba4 Nf6");
    expect(panel).toHaveTextContent("Lasting pressure on e5.");
    expect(seen).toHaveLength(1);

    // Next position resets the guess.
    await user.click(within(panel).getByRole("button", { name: "Next position →" }));
    const next = screen.getByRole("region", { name: "Guess the evaluation" });
    expect(within(next).getByRole("group", { name: "Your evaluation" })).toBeInTheDocument();
  });

  it("explains when the engine can't analyse a position", async () => {
    seed("8/pp3ppp/2p5/3p4/3P4/8/PP3PPP/8");
    const analyse: Analyse = () => Promise.reject(new Error("should not be called"));
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Just show me" }));
    expect(screen.getByText("The engine needs a legal position with both kings.")).toBeInTheDocument();
  });

  it("hides what comes next while training, and picks verdicts with number keys", async () => {
    seed("1.e4 e5 2.Nf3 $14 {Development.} Nc6 3.Bb5", { ply: 2 });
    const analyse: Analyse = async () => ({ score: { cp: 20 }, depth: 12, line: ["Nf3"] });
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Hide what comes next" }));
    expect(screen.queryByLabelText("Moves or FEN")).not.toBeInTheDocument();
    expect(screen.getByText(/Hidden while you train/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2. Nf3" })).not.toBeInTheDocument();
    expect(screen.getByText("… 3 more moves hidden")).toBeInTheDocument();

    // Stepping forward reveals one move at a time.
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "2. Nf3" })).toBeInTheDocument();
    expect(screen.getByText("… 2 more moves hidden")).toBeInTheDocument();

    // Key 3 is "White is slightly better".
    fireEvent.keyDown(document.body, { key: "3" });
    const panel = screen.getByRole("region", { name: "Guess the evaluation" });
    expect(await within(panel).findByText("You")).toBeInTheDocument();
    expect(panel.querySelector(".eval-row")).toHaveTextContent("YouWhite is slightly better");
    expect(panel).toHaveTextContent("Development.");

    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByLabelText("Moves or FEN")).toBeInTheDocument();
  });
  it("finds the turning points of a game and jumps to the position before the mistake", async () => {
    seed("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#");
    const scores = [20, 30, 25, -40, -30, -35, 100000];
    let calls = 0;
    const analyse: Analyse = async (_fen, movetime) => {
      expect(movetime).toBe(300);
      const cp = scores[calls] ?? 100000;
      calls += 1;
      return { score: { cp }, depth: 10, line: calls === 6 ? ["g6"] : [] };
    };
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    const panel = screen.getByRole("region", { name: "Turning points" });
    expect(panel).toHaveTextContent("Analyse the game yourself first.");
    await user.click(within(panel).getByRole("button", { name: "Check the game with the engine" }));
    const list = await within(panel).findByRole("status", { name: "Mistakes" });
    expect(list).toHaveTextContent("??3...Nf6blunder: 53% → 2% of the points · better g6");
    expect(calls).toBe(8);

    await user.click(within(list).getByRole("button"));
    expect(screen.getByRole("button", { name: "3. Bc4" })).toHaveAttribute("aria-current", "step");
  });

  it("hides turning points while training with what comes next hidden", async () => {
    seed("1.e4 e5 2.Nf3 Nc6");
    const user = userEvent.setup();
    render(<App initialSheet={seeded} />);
    expect(screen.getByRole("region", { name: "Turning points" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Hide what comes next" }));
    expect(screen.queryByRole("region", { name: "Turning points" })).not.toBeInTheDocument();
  });
  it("compares the engine's top moves in the position on screen", async () => {
    seed("1.e4 c5 2.Nc3 Nc6 3.Bb5 Nd4");
    const asked: (number | undefined)[] = [];
    const analyse: Analyse = async (_fen, movetime, lines) => {
      asked.push(movetime, lines);
      return {
        score: { cp: -1 },
        depth: 20,
        line: ["a4"],
        candidates: [
          { score: { cp: -1 }, line: ["a4", "a6", "Bc4"] },
          { score: { cp: -2 }, line: ["Nf3", "a6"] },
          { score: { cp: -16 }, line: ["Be2", "e6"] },
        ],
      };
    };
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    const panel = screen.getByRole("region", { name: "Compare moves" });
    await user.click(within(panel).getByRole("button", { name: "Engine’s top 5" }));
    const list = await within(panel).findByRole("list", { name: "Candidate moves" });
    expect([...list.querySelectorAll("li")].map((li) => li.textContent)).toEqual([
      "0.04.a4 a6 5.Bc4",
      "0.04.Nf3 a6",
      "−0.24.Be2 e6",
    ]);
    expect(asked).toEqual([3000, 5]);
  });

  it("adds the positions before a game's mistakes to the sheet, without the engine's answers", async () => {
    seed("1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#", { caption: "My game" });
    const scores = [20, 30, 25, -40, -30, -35, 100000];
    let calls = 0;
    const analyse: Analyse = async () => {
      const cp = scores[calls] ?? 100000;
      calls += 1;
      return { score: { cp }, depth: 10, line: calls === 6 ? ["g6"] : [] };
    };
    const user = userEvent.setup();
    render(
      <EngineContext.Provider value={analyse}>
        <App initialSheet={seeded} />
      </EngineContext.Provider>,
    );
    const panel = screen.getByRole("region", { name: "Turning points" });
    await user.click(within(panel).getByRole("button", { name: "Check the game with the engine" }));
    await user.click(await within(panel).findByRole("button", { name: "+ Add this position to the sheet" }));
    expect(screen.getByText("Added 1 position to the sheet")).toBeInTheDocument();
    const titles = [...document.querySelectorAll(".diagram-title")].map((el) => el.textContent);
    expect(titles).toEqual(["My game", "3...Nf6?? was played. What’s better, and why?"]);
  });
});
