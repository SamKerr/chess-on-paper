import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getEngine, type Analysis } from "../lib/engine";
import {
  compareVerdicts,
  formatScore,
  VERDICT_WORDS,
  VERDICTS,
  verdictFromScore,
  type Closeness,
  type Score,
  type Verdict,
} from "../lib/evaluation";
import type { Ply } from "../lib/notation";
import { numberedLine } from "../lib/format";
import { MoveText } from "./MoveText";
import { VerdictMark } from "./VerdictMark";

export type Analyse = (fen: string, movetime?: number, lines?: number) => Promise<Analysis>;

/** The engine the app uses; tests provide a fake. */
export const EngineContext = createContext<Analyse>((fen, movetime, lines) => getEngine().analyse(fen, movetime, lines));

const CLOSENESS: Record<Closeness, string> = {
  exact: "Spot on",
  close: "One step off",
  off: "Off",
  "wrong-side": "Wrong side",
};

interface Props {
  fen: string;
  /** The move that led here, for the annotator's verdict and any stored engine score */
  lastPly: Ply | null;
  canAnalyse: boolean;
  onNext: (() => void) | null;
  figurines: boolean;
}

type EngineState =
  | { status: "idle" }
  | { status: "thinking" }
  | { status: "done"; analysis: Analysis }
  | { status: "error"; message: string };

/** Guess first, then reveal: on screen, one position at a time, nothing kept. */
export function EvalGuess({ fen, lastPly, canAnalyse, onNext, figurines }: Props) {
  const analyse = useContext(EngineContext);
  const [guess, setGuess] = useState<Verdict | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [engine, setEngine] = useState<EngineState>({ status: "idle" });

  // The panel is keyed by position, so a late answer for an old position is dropped.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Keys 1-8 pick a verdict, left to right, so you can step with ← → and guess without the mouse.
  const revealRef = useRef<(v: Verdict | null) => void>(() => {});
  useEffect(() => {
    if (revealed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable]")) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < VERDICTS.length) {
        e.preventDefault();
        revealRef.current(VERDICTS[i]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed]);

  const reveal = (v: Verdict | null) => {
    setGuess(v);
    setRevealed(true);
    if (!canAnalyse) return;
    setEngine({ status: "thinking" });
    analyse(fen).then(
      (analysis) => mounted.current && setEngine({ status: "done", analysis }),
      (e: unknown) =>
        mounted.current && setEngine({ status: "error", message: e instanceof Error ? e.message : "The engine failed." }),
    );
  };

  useEffect(() => {
    revealRef.current = reveal;
  });

  return (
    <section className="eval-guess" aria-label="Guess the evaluation">
      <div className="eval-head">
        <span className="label">Guess the evaluation</span>
        {!revealed && (
          <span className="eval-head-actions">
            <span className="hint">Keys 1–8</span>
            <button type="button" className="btn small ghost" onClick={() => reveal(null)}>
              Just show me
            </button>
          </span>
        )}
      </div>
      {!revealed ? (
        <div className="verdicts" role="group" aria-label="Your evaluation">
          {VERDICTS.map((v) => (
            <button key={v} type="button" className="verdict" aria-label={VERDICT_WORDS[v]} title={VERDICT_WORDS[v]} onClick={() => reveal(v)}>
              <VerdictMark verdict={v} />
            </button>
          ))}
        </div>
      ) : (
        <div className="eval-reveal" aria-live="polite">
          {guess && (
            <p className="eval-row">
              <span className="eval-source">You</span>
              <Symbol verdict={guess} />
            </p>
          )}
          {canAnalyse ? (
            <EngineRow state={engine} guess={guess} figurines={figurines} fen={fen} />
          ) : (
            <p className="hint">The engine needs a legal position with both kings.</p>
          )}
          {lastPly?.score && <ScoreRow source="Stored in the game" score={lastPly.score} guess={guess} />}
          {lastPly?.verdict && (
            <div>
              <p className="eval-row">
                <span className="eval-source">Annotator</span>
                <Symbol verdict={lastPly.verdict} />
                {guess && <Feedback c={compareVerdicts(guess, lastPly.verdict)} />}
              </p>
              {lastPly.comment && <p className="eval-comment">{lastPly.comment}</p>}
            </div>
          )}
          <div className="eval-actions">
            {onNext && (
              <button type="button" className="btn small primary" onClick={onNext}>
                Next position →
              </button>
            )}
            <button
              type="button"
              className="btn small ghost"
              onClick={() => {
                setRevealed(false);
                setGuess(null);
                setEngine({ status: "idle" });
              }}
            >
              Guess again
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Symbol({ verdict }: { verdict: Verdict }) {
  return (
    <>
      <span className="eval-symbol" aria-hidden="true">
        <VerdictMark verdict={verdict} />
      </span>
      <span className="eval-words">{VERDICT_WORDS[verdict]}</span>
    </>
  );
}

function Feedback({ c }: { c: Closeness }) {
  return <span className={`eval-feedback ${c}`}>{CLOSENESS[c]}</span>;
}

function ScoreRow({ source, score, guess }: { source: string; score: Score; guess: Verdict | null }) {
  const verdict = verdictFromScore(score);
  return (
    <p className="eval-row">
      <span className="eval-source">{source}</span>
      <Symbol verdict={verdict} />
      <span className="eval-score">{formatScore(score)}</span>
      {guess && <Feedback c={compareVerdicts(guess, verdict)} />}
    </p>
  );
}

function EngineRow({ state, guess, figurines, fen }: { state: EngineState; guess: Verdict | null; figurines: boolean; fen: string }) {
  if (state.status === "idle" || state.status === "thinking") {
    return (
      <p className="eval-row">
        <span className="eval-source">Engine</span>
        <span className="hint">Thinking… (the first time loads Stockfish, about 2 MB)</span>
      </p>
    );
  }
  if (state.status === "error") return <p className="hint warn-text">{state.message}</p>;
  const { analysis } = state;
  if (analysis.over) {
    const verdict = verdictFromScore(analysis.score);
    return (
      <p className="eval-row">
        <span className="eval-source">Result</span>
        <span className="eval-words">{analysis.over}</span>
        {guess && <Feedback c={compareVerdicts(guess, verdict)} />}
      </p>
    );
  }
  return (
    <div>
      <ScoreRow source="Engine" score={analysis.score} guess={guess} />
      {analysis.line.length > 0 && (
        <p className="eval-comment">
          Best line<span className="eval-depth">, depth {analysis.depth}</span>: <MoveText text={numberedLine(fen, analysis.line.slice(0, 8))} figurines={figurines} />
        </p>
      )}
    </div>
  );
}
