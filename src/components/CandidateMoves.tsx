import { useContext, useEffect, useRef, useState } from "react";
import type { Analysis } from "../lib/engine";
import { formatScore, verdictFromScore } from "../lib/evaluation";
import { numberedLine } from "../lib/format";
import { EngineContext } from "./EvalGuess";
import { MoveText } from "./MoveText";
import { VerdictMark } from "./VerdictMark";

const LINES = 5;
const MOVETIME = 3000;

type State = { status: "idle" } | { status: "thinking" } | { status: "done"; analysis: Analysis } | { status: "error"; message: string };

/** The engine's top moves in a position, for testing your own opening or middlegame choices. */
export function CandidateMoves({ fen, figurines }: { fen: string; figurines: boolean }) {
  const analyse = useContext(EngineContext);
  const [state, setState] = useState<State>({ status: "idle" });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const compare = () => {
    setState({ status: "thinking" });
    analyse(fen, MOVETIME, LINES).then(
      (analysis) => mounted.current && setState({ status: "done", analysis }),
      (e: unknown) => mounted.current && setState({ status: "error", message: e instanceof Error ? e.message : "The engine failed." }),
    );
  };

  const candidates = state.status === "done" ? (state.analysis.candidates ?? [{ score: state.analysis.score, line: state.analysis.line }]) : [];

  return (
    <section className="candidates" aria-label="Compare moves">
      <div className="eval-head">
        <span className="label">Compare moves</span>
        {state.status !== "thinking" && (
          <button type="button" className="btn small" onClick={compare}>
            {state.status === "done" ? "Again" : `Engine’s top ${LINES}`}
          </button>
        )}
      </div>
      {state.status === "idle" && <p className="hint">Decide what you’d play first, then compare.</p>}
      {state.status === "thinking" && (
        <p className="hint" role="status">
          Thinking for {MOVETIME / 1000} seconds…
        </p>
      )}
      {state.status === "error" && <p className="hint warn-text">{state.message}</p>}
      {state.status === "done" && state.analysis.over && <p className="hint">{state.analysis.over}: no moves to compare.</p>}
      {state.status === "done" && !state.analysis.over && (
        <ol className="candidate-list" aria-label="Candidate moves">
          {candidates.map((c, i) => {
            const text = numberedLine(fen, c.line.slice(0, 6));
            const [first, ...rest] = text.split(" ");
            return (
              <li key={i} className="candidate">
                <span className="candidate-mark" aria-hidden="true">
                  <VerdictMark verdict={verdictFromScore(c.score)} />
                </span>
                <span className="candidate-score">{formatScore(c.score)}</span>
                <span className="candidate-line">
                  <strong>
                    <MoveText text={first ?? ""} figurines={figurines} />
                  </strong>{" "}
                  <MoveText text={rest.join(" ")} figurines={figurines} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
